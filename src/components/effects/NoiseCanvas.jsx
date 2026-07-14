import { useCallback, useEffect, useRef } from 'react'
import useActivityRenderLoop from './useActivityRenderLoop.js'
import {
  createFullscreenQuad,
  createProgram,
  disposeGLResources,
  FULLSCREEN_VERTEX_SHADER,
  scheduleWebGLContextRelease,
} from './webgl.js'

const FRAGMENT_SHADER = `
  precision highp float;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uNight;
  uniform float uNoiseScale;

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
    float t = uTime * GRAIN_SPEED;
    vec2 guv = gl_FragCoord.xy * uNoiseScale / uResolution;
    float seed = dot(guv, vec2(12.9898, 78.233));
    float noise = fract(sin(seed) * 43758.5453 + t);
    float variance = mix(GRAIN_VARIANCE_DAY, GRAIN_VARIANCE_NIGHT, uNight);
    noise = gaussian(noise, GRAIN_MEAN, variance * variance);
    float intensity = mix(GRAIN_INTENSITY_DAY, GRAIN_INTENSITY_NIGHT, uNight);
    gl_FragColor = vec4(vec3(1.0), clamp(noise * intensity, 0.0, 1.0));
  }
`

export default function NoiseCanvas({ className = '' }) {
  const canvasRef = useRef(null)
  const rendererRef = useRef(null)
  const cancelContextReleaseRef = useRef(null)

  const draw = useCallback((time) => {
    const renderer = rendererRef.current
    if (!renderer || renderer.gl.isContextLost?.()) return false

    const { gl, uniforms, size, startedAt } = renderer
    gl.uniform2f(uniforms.resolution, size.width, size.height)
    gl.uniform1f(uniforms.time, (time - startedAt) / 1000)
    gl.uniform1f(uniforms.night, document.documentElement.classList.contains('theme-night') ? 1 : 0)
    gl.uniform1f(uniforms.noiseScale, size.dpr < 1.5 ? 3 : 2)
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

      renderer = {
        gl,
        uniforms: {
          resolution: gl.getUniformLocation(program, 'uResolution'),
          time: gl.getUniformLocation(program, 'uTime'),
          night: gl.getUniformLocation(program, 'uNight'),
          noiseScale: gl.getUniformLocation(program, 'uNoiseScale'),
        },
        size: { width: 1, height: 1, dpr: 1 },
        startedAt: performance.now(),
        resources: { buffers: [buffer], programs: [program] },
      }
      rendererRef.current = renderer
      resize()
    }

    const onContextLost = (event) => {
      event.preventDefault()
      renderer = null
      rendererRef.current = null
    }
    const onContextRestored = () => {
      initializeRenderer()
      requestRender()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    canvas.addEventListener('webglcontextlost', onContextLost)
    canvas.addEventListener('webglcontextrestored', onContextRestored)
    initializeRenderer()

    return () => {
      resizeObserver.disconnect()
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      destroyRenderer()
      cancelContextReleaseRef.current = scheduleWebGLContextRelease(currentContext)
    }
  }, [])

  const requestRender = useActivityRenderLoop(canvasRef, draw, { redrawOnThemeChange: true })

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />
}
