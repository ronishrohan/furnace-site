import { useCallback, useEffect, useRef } from 'react'
import { getPointerPosition, retainGlobalPointer } from '../effects/pointer.js'
import useActivityRenderLoop from '../effects/useActivityRenderLoop.js'
import {
  cancelTextureLoads,
  createFullscreenQuad,
  createProgram,
  disposeGLResources,
  FULLSCREEN_VERTEX_SHADER,
  loadTexture,
  scheduleWebGLContextRelease,
} from '../effects/webgl.js'

const FRAGMENT_SHADER = `
  precision highp float;
  uniform vec2 uResolution;
  uniform vec2 uTexSize;
  uniform vec2 uMouse;
  uniform float uNight;
  uniform float uTime;
  uniform float uNoiseScale;
  uniform float uThreshold;
  uniform float uImageMode;
  uniform float uAccent;
  uniform sampler2D uNormalMap;

  #define GRAIN_INTENSITY_DAY 0.5
  #define GRAIN_INTENSITY_NIGHT 0.09
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
    n.xy *= mix(1.3, 2.4, uAccent);
    n = normalize(n);

    vec3 fragPos = vec3(gl_FragCoord.xy, 0.0);
    float lightHeight = uResolution.y * 0.6;
    vec3 lightPos = vec3(uMouse, lightHeight);
    vec3 L = normalize(lightPos - fragPos);
    float diff = max(dot(n, L), 0.0);
    float dist = distance(gl_FragCoord.xy, uMouse);
    float radius = uResolution.y * 3.5;
    float falloff = 1.0 - smoothstep(0.0, radius, dist);
    falloff = falloff * falloff;

    float elevated = smoothstep(uThreshold, uThreshold + 0.01, n.z);
    vec3 darkNight = vec3(0.10, 0.10, 0.11);
    vec3 darkDay = vec3(0.49, 0.47, 0.39);
    vec3 dark = mix(darkDay, darkNight, uNight);
    vec3 lightAlbedo = vec3(0.18, 0.18, 0.18);
    vec3 albedo = mix(dark, lightAlbedo, elevated);

    vec3 accentColor = vec3(0.357, 0.553, 0.937);
    vec3 defaultLight = mix(vec3(1.0, 0.94, 0.72), vec3(1.0), uNight);
    vec3 lightColor = mix(defaultLight, accentColor, uAccent * uNight);
    float lightAmt = diff * falloff * 0.28 * mix(1.0, 2.6, uAccent);
    vec3 color = albedo * 0.85 + lightColor * lightAmt;

    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    float t = uTime * GRAIN_SPEED;
    vec2 guv = gl_FragCoord.xy * uNoiseScale / uResolution;
    float seed = dot(guv, vec2(12.9898, 78.233));
    float noise = fract(sin(seed) * 43758.5453 + t);
    float variance = mix(GRAIN_VARIANCE_DAY, GRAIN_VARIANCE_NIGHT, uNight);
    noise = gaussian(noise, GRAIN_MEAN, variance * variance);
    float grainIntensity = mix(GRAIN_INTENSITY_DAY, GRAIN_INTENSITY_NIGHT, uNight) * 0.3;
    color += vec3(noise) * (1.0 - gray) * grainIntensity;
    color = clamp(color, 0.0, 1.0);

    if (uImageMode > 0.5) {
      vec3 veilColor = dark + lightColor * lightAmt + vec3(noise) * (1.0 - gray) * grainIntensity;
      veilColor = clamp(veilColor, 0.0, 1.0);
      gl_FragColor = vec4(veilColor, 0.62);
      return;
    }
    gl_FragColor = vec4(color, 1.0);
  }
`

export function resolveAccent(current, target, reducedMotion) {
  return reducedMotion ? target : current + (target - current) * 0.12
}

export default function GraphCardBackground({ normalMap = '/assets/features/fork-conversation-normal-map.png', threshold = 0.90, image = null, accent = false, dim = false, children }) {
  const canvasRef = useRef(null)
  const rendererRef = useRef(null)
  const cancelContextReleaseRef = useRef(null)
  const targetRef = useRef(accent ? 1 : 0)

  useEffect(() => {
    targetRef.current = accent ? 1 : 0
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches && rendererRef.current) {
      rendererRef.current.accent = targetRef.current
    }
    requestRender()
  }, [accent])

  const draw = useCallback((time) => {
    const renderer = rendererRef.current
    if (!renderer || renderer.gl.isContextLost?.()) return false

    const { canvas, gl, uniforms, size, textureSize } = renderer
    const pointer = getPointerPosition()
    const rect = canvas.getBoundingClientRect()
    const mouseX = pointer.x === null ? canvas.offsetWidth / 2 : pointer.x - rect.left
    const mouseY = pointer.y === null ? canvas.offsetHeight / 2 : pointer.y - rect.top
    renderer.accent = resolveAccent(
      renderer.accent,
      targetRef.current,
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    )

    gl.uniform2f(uniforms.resolution, size.width, size.height)
    gl.uniform2f(uniforms.texSize, textureSize.width, textureSize.height)
    gl.uniform2f(uniforms.mouse, mouseX * size.dpr, size.height - mouseY * size.dpr)
    gl.uniform1f(uniforms.night, document.documentElement.classList.contains('theme-night') || document.body.classList.contains('theme-night') ? 1 : 0)
    gl.uniform1f(uniforms.time, (time - renderer.startedAt) / 1000)
    gl.uniform1f(uniforms.noiseScale, size.dpr < 1.5 ? 3 : 2)
    gl.uniform1f(uniforms.threshold, threshold)
    gl.uniform1f(uniforms.imageMode, image ? 1 : 0)
    gl.uniform1f(uniforms.accent, renderer.accent)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    return true
  }, [image, threshold])

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
      const width = Math.max(1, Math.floor(canvas.offsetWidth * dpr))
      const height = Math.max(1, Math.floor(canvas.offsetHeight * dpr))
      if (canvas.width !== width) canvas.width = width
      if (canvas.height !== height) canvas.height = height
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
      const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false })
      if (!gl) return
      currentContext = gl
      const program = createProgram(gl, FULLSCREEN_VERTEX_SHADER, FRAGMENT_SHADER)
      if (!program) return
      const buffer = createFullscreenQuad(gl, program)
      if (!buffer) {
        disposeGLResources(gl, { programs: [program] })
        return
      }

      const textureSize = { width: 1, height: 1 }
      const textureLoad = loadTexture(gl, normalMap, {
        onLoad(loadedImage) {
          textureSize.width = loadedImage.width
          textureSize.height = loadedImage.height
          requestRender()
        },
      })
      if (!textureLoad) {
        disposeGLResources(gl, { buffers: [buffer], programs: [program] })
        return
      }

      const uniforms = Object.fromEntries(
        [
          ['resolution', 'uResolution'],
          ['texSize', 'uTexSize'],
          ['mouse', 'uMouse'],
          ['night', 'uNight'],
          ['time', 'uTime'],
          ['noiseScale', 'uNoiseScale'],
          ['threshold', 'uThreshold'],
          ['imageMode', 'uImageMode'],
          ['accent', 'uAccent'],
          ['normalMap', 'uNormalMap'],
        ].map(([key, name]) => [key, gl.getUniformLocation(program, name)]),
      )
      gl.activeTexture(gl.TEXTURE0)
      gl.uniform1i(uniforms.normalMap, 0)
      renderer = {
        canvas,
        gl,
        uniforms,
        textureSize,
        size: { width: 1, height: 1, dpr: 1 },
        accent: targetRef.current,
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
    redrawOnThemeChange: true,
  })

  return (
    <div className="relative w-full h-full bg-[#15151a]">
      {image && (
        <img
          src={image}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          style={{ opacity: dim ? 0 : 0.15 }}
          className="absolute inset-0 w-full h-full object-cover grayscale pointer-events-none select-none transition-opacity duration-300"
        />
      )}
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  )
}
