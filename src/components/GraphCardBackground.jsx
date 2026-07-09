import { useEffect, useRef } from 'react'

export default function GraphCardBackground({ normalMap = '/graph-normal.png', threshold = 0.90, image = null, accent = false, dim = false, children }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const targetRef = useRef({ accent: accent ? 1 : 0, strength: dim ? 0 : 1 })

  useEffect(() => {
    targetRef.current.accent = accent ? 1 : 0
    targetRef.current.strength = dim ? 0 : 1
  }, [accent, dim])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false })
    if (!gl) return
    const imageMode = image ? 1.0 : 0.0

    const VERT = `
      attribute vec2 aPos;
      void main() {
        gl_Position = vec4(aPos, 0.0, 1.0);
      }
    `

    const FRAG = `
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
      uniform float uStrength;
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
        n.xy *= 1.3;
        n = normalize(n);

        vec3 fragPos = vec3(gl_FragCoord.xy, 0.0);
        float lightHeight = uResolution.y * 0.6;
        vec3 lightPos = vec3(uMouse, lightHeight);
        vec3 L = normalize(lightPos - fragPos);

        // Diffuse from the normal map: elevated/up-facing parts catch more light
        float diff = max(dot(n, L), 0.0);

        // Circular spotlight centered on the mouse
        float dist = distance(gl_FragCoord.xy, uMouse);
        float radius = uResolution.y * 3.5;
        float falloff = 1.0 - smoothstep(0.0, radius, dist);
        falloff = falloff * falloff;

        // Plane albedo: sharp two-tone from the normal map (elevated -> white, lower -> dark)
        float elevated = smoothstep(uThreshold, uThreshold + 0.01, n.z);
        vec3 darkNight = vec3(0.10, 0.10, 0.11);
        vec3 darkDay = vec3(0.48, 0.48, 0.45);
        vec3 dark = mix(darkDay, darkNight, uNight);
        vec3 lightAlbedo = vec3(0.18, 0.18, 0.18);
        vec3 albedo = mix(dark, lightAlbedo, elevated);

        // Light color: white by default, blue accent on hover
        vec3 accentColor = vec3(0.357, 0.553, 0.937);
        vec3 lightColor = mix(vec3(1.0), accentColor, uAccent);

        // Point light illuminates the albedo (dim, wide); strength fades other cards out
        float lightAmt = diff * falloff * 0.28 * uStrength;
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
          // Translucent dark veil + point light + grain, over the desaturated image below.
          vec3 veilColor = dark + lightColor * lightAmt + vec3(noise) * (1.0 - gray) * grainIntensity;
          veilColor = clamp(veilColor, 0.0, 1.0);
          gl_FragColor = vec4(veilColor, 0.62);
          return;
        }

        gl_FragColor = vec4(color, 1.0);
      }
    `

    function compile(type, src) {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s))
        return null
      }
      return s
    }

    const prog = gl.createProgram()
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog))
      return
    }
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uni = {
      resolution: gl.getUniformLocation(prog, 'uResolution'),
      texSize: gl.getUniformLocation(prog, 'uTexSize'),
      mouse: gl.getUniformLocation(prog, 'uMouse'),
      night: gl.getUniformLocation(prog, 'uNight'),
      time: gl.getUniformLocation(prog, 'uTime'),
      noiseScale: gl.getUniformLocation(prog, 'uNoiseScale'),
      threshold: gl.getUniformLocation(prog, 'uThreshold'),
      imageMode: gl.getUniformLocation(prog, 'uImageMode'),
      accent: gl.getUniformLocation(prog, 'uAccent'),
      strength: gl.getUniformLocation(prog, 'uStrength'),
      normalMap: gl.getUniformLocation(prog, 'uNormalMap'),
    }

    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([128, 128, 255]))
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    let texW = 1, texH = 1
    const img = new Image()
    img.onload = () => {
      texW = img.width
      texH = img.height
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img)
    }
    img.src = normalMap

    gl.activeTexture(gl.TEXTURE0)
    gl.uniform1i(uni.normalMap, 0)

    let W = 0, H = 0, dpr = 1

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = canvas.width = Math.floor(canvas.offsetWidth * dpr)
      H = canvas.height = Math.floor(canvas.offsetHeight * dpr)
      gl.viewport(0, 0, W, H)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let mouseX = canvas.offsetWidth / 2, mouseY = canvas.offsetHeight / 2
    function onMove(e) {
      const rect = canvas.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    function isNight() {
      return document.documentElement.classList.contains('theme-night') ||
        document.body.classList.contains('theme-night')
    }

    const start = performance.now()
    let curAccent = targetRef.current.accent
    let curStrength = targetRef.current.strength

    function draw() {
      const elapsed = performance.now() - start
      curAccent += (targetRef.current.accent - curAccent) * 0.12
      curStrength += (targetRef.current.strength - curStrength) * 0.12
      gl.uniform2f(uni.resolution, W, H)
      gl.uniform2f(uni.texSize, texW, texH)
      gl.uniform2f(uni.mouse, mouseX * dpr, H - mouseY * dpr)
      gl.uniform1f(uni.night, isNight() ? 1.0 : 0.0)
      gl.uniform1f(uni.time, elapsed / 1000.0)
      gl.uniform1f(uni.noiseScale, dpr < 1.5 ? 3.0 : 2.0)
      gl.uniform1f(uni.threshold, threshold)
      gl.uniform1f(uni.imageMode, imageMode)
      gl.uniform1f(uni.accent, curAccent)
      gl.uniform1f(uni.strength, curStrength)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
    }
  }, [normalMap, threshold, image])

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#15151a]">
      {image && (
        <img
          src={image}
          alt=""
          aria-hidden="true"
          style={{ opacity: dim ? 0 : 0.15 }}
          className="absolute inset-0 w-full h-full object-cover grayscale pointer-events-none select-none transition-opacity duration-300"
        />
      )}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  )
}
