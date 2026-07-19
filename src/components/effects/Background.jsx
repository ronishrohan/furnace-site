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

  uniform vec2  uResolution;
  uniform vec2  uTexSize;
  uniform vec2  uMouse;
  uniform float uTime;
  uniform float uNight;
  uniform float uNoiseScale;
  uniform float uLightFade;
  uniform sampler2D uNormalMap;

  #define GRAIN_INTENSITY_DAY 0.45
  #define GRAIN_INTENSITY_NIGHT 0.12
  #define GRAIN_SPEED 1.5
  #define GRAIN_MEAN 0.0
  #define GRAIN_VARIANCE_DAY 0.75
  #define GRAIN_VARIANCE_NIGHT 0.6

  float gaussian(float z, float u, float o) {
    return (1.0 / (o * sqrt(2.0 * 3.1415))) * exp(-(((z - u) * (z - u)) / (2.0 * (o * o))));
  }

  void main() {
    float canvasAspect = uResolution.x / uResolution.y;
    float texAspect = uTexSize.x / uTexSize.y;
    vec2 uv = gl_FragCoord.xy / uResolution;
    uv.y = 1.0 - uv.y;
    if (canvasAspect > texAspect) {
      float scale = texAspect / canvasAspect;
      uv.y = (uv.y - 0.5) * scale + 0.5;
    } else {
      float scale = canvasAspect / texAspect;
      uv.x = (uv.x - 0.5) * scale + 0.5;
    }

    vec3 n = texture2D(uNormalMap, uv).rgb * 2.0 - 1.0;
    n.y = -n.y;
    n = normalize(n);

    vec3 fragPos = vec3(gl_FragCoord.xy, 0.0);
    float lightHeight = uResolution.y * 0.35;
    vec3 lightPos = vec3(uMouse, lightHeight);
    vec3 L = lightPos - fragPos;
    L = normalize(L);
    float diff = max(dot(n, L), 0.0);

    float screenDist = length(L.xy) / uResolution.y;
    float radius = 0.45;
    float falloff = 1.0 - smoothstep(0.0, radius, screenDist);
    falloff = falloff * falloff;

    vec3 baseNight  = vec3(0.080, 0.080, 0.083);
    vec3 lightNight = vec3(0.357, 0.553, 0.937);
    vec3 baseDay    = vec3(0.51, 0.50, 0.44);
    vec3 lightDay   = vec3(1.0, 0.94, 0.72);
    vec3 base = mix(baseDay, baseNight, uNight);
    vec3 lcol = mix(lightDay, lightNight, uNight);

    float lightIntensity = mix(0.15, 0.3, uNight) * uLightFade;
    vec3 color = base + lcol * diff * falloff * lightIntensity;

    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    float t = uTime * GRAIN_SPEED;
    vec2 guv = gl_FragCoord.xy * uNoiseScale / uResolution;
    float seed = dot(guv, vec2(12.9898, 78.233));
    float noise = fract(sin(seed) * 43758.5453 + t);
    float variance = mix(GRAIN_VARIANCE_DAY, GRAIN_VARIANCE_NIGHT, uNight);
    noise = gaussian(noise, GRAIN_MEAN, variance * variance);
    float grainIntensity = mix(GRAIN_INTENSITY_DAY, GRAIN_INTENSITY_NIGHT, uNight);
    color += vec3(noise) * (1.0 - gray) * grainIntensity;
    color = clamp(color, 0.0, 1.0);

    gl_FragColor = vec4(color, 1.0);
  }
`

export default function Background({ onReady }) {
  const canvasRef = useRef(null)
  const rendererRef = useRef(null)
  const cancelContextReleaseRef = useRef(null)
  const onReadyRef = useRef(onReady)
  const hasSignaledReadyRef = useRef(false)
  onReadyRef.current = onReady

  const signalReady = useCallback(() => {
    if (hasSignaledReadyRef.current) return
    hasSignaledReadyRef.current = true
    onReadyRef.current?.()
  }, [])

  const draw = useCallback((time) => {
    const renderer = rendererRef.current
    if (!renderer || renderer.gl.isContextLost?.()) return false

    const { gl, uniforms, size, textureSize, startedAt } = renderer
    const pointer = getPointerPosition()
    const targetX = pointer.x ?? window.innerWidth / 2
    const targetY = pointer.y ?? window.innerHeight / 2
    renderer.mouseX += (targetX - renderer.mouseX) * 0.08
    renderer.mouseY += (targetY - renderer.mouseY) * 0.08

    const elapsed = time - startedAt
    gl.uniform2f(uniforms.resolution, size.width, size.height)
    gl.uniform2f(uniforms.texSize, textureSize.width, textureSize.height)
    gl.uniform2f(uniforms.mouse, renderer.mouseX * size.dpr, size.height - renderer.mouseY * size.dpr)
    gl.uniform1f(uniforms.time, elapsed / 1000)
    gl.uniform1f(uniforms.night, document.documentElement.classList.contains('theme-night') ? 1 : 0)
    gl.uniform1f(uniforms.noiseScale, size.dpr < 1.5 ? 3.0 : 2.0)
    gl.uniform1f(uniforms.lightFade, Math.min(elapsed / 500, 1))
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    return true
  }, [])

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
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.floor(window.innerWidth * dpr)
      const height = Math.floor(window.innerHeight * dpr)
      if (canvas.width !== width) canvas.width = width
      if (canvas.height !== height) canvas.height = height
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      renderer.size = { width, height, dpr }
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

      const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
      if (!gl) {
        signalReady()
        return
      }
      currentContext = gl
      const program = createProgram(gl, FULLSCREEN_VERTEX_SHADER, FRAGMENT_SHADER)
      if (!program) {
        signalReady()
        return
      }
      const buffer = createFullscreenQuad(gl, program)
      if (!buffer) {
        disposeGLResources(gl, { programs: [program] })
        signalReady()
        return
      }

      const textureSize = { width: 1, height: 1 }
      const textureLoad = loadTexture(gl, '/assets/background/global-normal-map.png', {
        onLoad(image) {
          textureSize.width = image.width
          textureSize.height = image.height
          requestRender()
          signalReady()
        },
        onError: signalReady,
      })
      if (!textureLoad) {
        disposeGLResources(gl, { buffers: [buffer], programs: [program] })
        signalReady()
        return
      }

      const uniforms = {
        resolution: gl.getUniformLocation(program, 'uResolution'),
        texSize: gl.getUniformLocation(program, 'uTexSize'),
        mouse: gl.getUniformLocation(program, 'uMouse'),
        time: gl.getUniformLocation(program, 'uTime'),
        night: gl.getUniformLocation(program, 'uNight'),
        noiseScale: gl.getUniformLocation(program, 'uNoiseScale'),
        lightFade: gl.getUniformLocation(program, 'uLightFade'),
        normalMap: gl.getUniformLocation(program, 'uNormalMap'),
      }
      gl.activeTexture(gl.TEXTURE0)
      gl.uniform1i(uniforms.normalMap, 0)

      renderer = {
        gl,
        uniforms,
        textureSize,
        size: { width: 0, height: 0, dpr: 1 },
        mouseX: window.innerWidth / 2,
        mouseY: window.innerHeight / 2,
        startedAt: performance.now(),
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
    window.addEventListener('resize', resize, { passive: true })
    canvas.addEventListener('webglcontextlost', onContextLost)
    canvas.addEventListener('webglcontextrestored', onContextRestored)
    initializeRenderer()

    return () => {
      disposed = true
      releasePointer()
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      destroyRenderer()
      cancelContextReleaseRef.current = scheduleWebGLContextRelease(currentContext)
    }
  }, [])

  const requestRender = useActivityRenderLoop(canvasRef, draw, {
    observeOffscreen: false,
    redrawOnThemeChange: true,
  })

  return (
    <canvas
      id="canvas"
      ref={canvasRef}
      className="block w-screen h-screen fixed top-0 left-0 z-0 supports-[height:100dvh]:h-[100dvh]"
    />
  )
}
