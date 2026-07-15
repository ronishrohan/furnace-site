import { useCallback, useEffect, useRef } from 'react'
import { getPointerPosition, retainGlobalPointer } from './pointer.js'
import useActivityRenderLoop from './useActivityRenderLoop.js'
import {
  cancelTextureLoads,
  createFullscreenQuad,
  createProgram,
  disposeGLResources,
  FULLSCREEN_VERTEX_SHADER,
  loadTexture,
  scheduleWebGLContextRelease,
} from './webgl.js'

const FRAGMENT_SHADER = `
  precision highp float;
  uniform vec2 uResolution;
  uniform vec3 uLightDir;
  uniform float uFlipX;
  uniform sampler2D uNormalMap;

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec2 centered = uv * 2.0 - 1.0;
    float r = length(centered);

    float edgeWidth = 2.0 / min(uResolution.x, uResolution.y);
    float alpha = 1.0 - smoothstep(1.0 - edgeWidth, 1.0, r);
    if (alpha <= 0.0) discard;

    float sx = mix(uv.x, 1.0 - uv.x, uFlipX);
    vec2 normalUv = vec2(sx, 1.0 - uv.y);
    vec2 texel = 1.0 / uResolution;
    vec3 normalSample =
      texture2D(uNormalMap, normalUv).rgb * 0.50 +
      texture2D(uNormalMap, normalUv + vec2(texel.x, 0.0)).rgb * 0.125 +
      texture2D(uNormalMap, normalUv - vec2(texel.x, 0.0)).rgb * 0.125 +
      texture2D(uNormalMap, normalUv + vec2(0.0, texel.y)).rgb * 0.125 +
      texture2D(uNormalMap, normalUv - vec2(0.0, texel.y)).rgb * 0.125;
    vec3 n = normalSample * 2.0 - 1.0;
    n.y = -n.y;
    n.x = mix(n.x, -n.x, uFlipX);
    n.xy *= 0.45;
    n = normalize(n);

    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 L = normalize(uLightDir);
    float diff = max(dot(n, L), 0.0);
    vec3 refl = reflect(-viewDir, n);
    float env = 0.5 + 0.5 * cos((refl.y + L.y * 1.6) * 6.0 + (refl.x + L.x * 1.6) * 2.5);
    env = pow(env, 1.6);
    float spec = pow(max(dot(reflect(-L, n), viewDir), 0.0), 90.0);
    float fres = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);

    vec3 steelDark = vec3(0.16, 0.17, 0.20);
    vec3 steelLight = vec3(0.86, 0.88, 0.94);
    vec3 color = mix(steelDark, steelLight, clamp(env * 0.7 + diff * 0.35, 0.0, 1.0));
    color += vec3(1.0) * spec;
    color += vec3(0.55, 0.68, 0.95) * fres * 0.45;
    color = clamp(color, 0.0, 1.0);
    gl_FragColor = vec4(color, alpha);
  }
`

function clampUnit(value) {
  return Math.max(-1.4, Math.min(1.4, value))
}

export default function Coin({ size, normalMap, flipX = false, active = true }) {
  const canvasRef = useRef(null)
  const rendererRef = useRef(null)
  const cancelContextReleaseRef = useRef(null)

  const draw = useCallback(() => {
    const renderer = rendererRef.current
    if (!renderer || renderer.gl.isContextLost?.()) return false

    const { canvas, gl, uniforms, width, height } = renderer
    const rect = canvas.getBoundingClientRect()
    const pointer = getPointerPosition()
    let targetX = -0.35
    let targetY = 0.55
    if (pointer.x !== null && pointer.y !== null) {
      const radius = Math.max(rect.width, rect.height)
      targetX = clampUnit((pointer.x - (rect.left + rect.width / 2)) / radius)
      targetY = clampUnit(-(pointer.y - (rect.top + rect.height / 2)) / radius)
    }
    renderer.lightX += (targetX - renderer.lightX) * 0.1
    renderer.lightY += (targetY - renderer.lightY) * 0.1

    gl.uniform2f(uniforms.resolution, width, height)
    gl.uniform3f(uniforms.lightDir, renderer.lightX, renderer.lightY, 0.75)
    gl.uniform1f(uniforms.flipX, flipX ? 1 : 0)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    return true
  }, [flipX])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    cancelContextReleaseRef.current?.()
    cancelContextReleaseRef.current = null

    let renderer = null
    let currentContext = null
    let disposed = false

    const resize = () => {
      if (!renderer) return
      const width = Math.max(1, Math.floor(canvas.offsetWidth * 2))
      const height = Math.max(1, Math.floor(canvas.offsetHeight * 2))
      if (canvas.width !== width) canvas.width = width
      if (canvas.height !== height) canvas.height = height
      renderer.width = width
      renderer.height = height
      renderer.gl.viewport(0, 0, width, height)
      requestRender()
    }

    const destroyRenderer = () => {
      if (!renderer) return
      disposeGLResources(renderer.gl, renderer.resources)
      if (rendererRef.current === renderer) rendererRef.current = null
      renderer = null
    }

    const initializeRenderer = () => {
      destroyRenderer()
      if (disposed) return
      const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false })
      if (!gl) return
      currentContext = gl
      const program = createProgram(gl, FULLSCREEN_VERTEX_SHADER, FRAGMENT_SHADER)
      if (!program) return
      const buffer = createFullscreenQuad(gl, program)
      if (!buffer) {
        disposeGLResources(gl, { programs: [program] })
        return
      }
      const textureLoad = loadTexture(gl, normalMap, { onLoad: requestRender })
      if (!textureLoad) {
        disposeGLResources(gl, { buffers: [buffer], programs: [program] })
        return
      }

      const uniforms = {
        resolution: gl.getUniformLocation(program, 'uResolution'),
        lightDir: gl.getUniformLocation(program, 'uLightDir'),
        flipX: gl.getUniformLocation(program, 'uFlipX'),
        normalMap: gl.getUniformLocation(program, 'uNormalMap'),
      }
      gl.activeTexture(gl.TEXTURE0)
      gl.uniform1i(uniforms.normalMap, 0)
      renderer = {
        canvas,
        gl,
        uniforms,
        width: 1,
        height: 1,
        lightX: -0.35,
        lightY: 0.55,
        resources: {
          buffers: [buffer],
          programs: [program],
          textures: [textureLoad.texture],
          textureLoads: [textureLoad],
        },
      }
      rendererRef.current = renderer
      resize()
    }

    const onContextLost = (event) => {
      event.preventDefault()
      if (renderer) cancelTextureLoads(renderer.resources)
      renderer = null
      rendererRef.current = null
    }
    const onContextRestored = () => {
      initializeRenderer()
      requestRender()
    }

    const releasePointer = retainGlobalPointer()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    window.addEventListener('resize', resize, { passive: true })
    canvas.addEventListener('webglcontextlost', onContextLost)
    canvas.addEventListener('webglcontextrestored', onContextRestored)
    initializeRenderer()

    return () => {
      disposed = true
      releasePointer()
      resizeObserver.disconnect()
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      destroyRenderer()
      cancelContextReleaseRef.current = scheduleWebGLContextRelease(currentContext)
    }
  }, [normalMap])

  const requestRender = useActivityRenderLoop(canvasRef, draw, {
    enabled: active,
  })

  return (
    <div className="relative cursor-pointer" style={{ width: `${size}px`, height: `${size}px` }}>
      <canvas ref={canvasRef} aria-hidden="true" className="h-full w-full" />
    </div>
  )
}
