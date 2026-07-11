import { useEffect, useRef, useState } from 'react'

export default function Coin({ size = 92, normalMap = '/nihal_normal.png', flipX = false }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const pointerRef = useRef({ x: null, y: null })
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false })
    if (!gl) return

    const VERT = `
      attribute vec2 aPos;
      void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
    `

    const FRAG = `
      precision highp float;
      uniform vec2 uResolution;
      uniform vec3 uLightDir;
      uniform float uFlipX;
      uniform sampler2D uNormalMap;

      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution;
        vec2 centered = uv * 2.0 - 1.0;
        float r = length(centered);

        float alpha = 1.0 - smoothstep(0.98, 1.0, r);
        if (alpha <= 0.0) discard;

        float sx = mix(uv.x, 1.0 - uv.x, uFlipX);
        vec3 n = texture2D(uNormalMap, vec2(sx, 1.0 - uv.y)).rgb * 2.0 - 1.0;
        n.y = -n.y;
        n.x = mix(n.x, -n.x, uFlipX);
        n.xy *= 0.45;
        n = normalize(n);

        vec3 viewDir = vec3(0.0, 0.0, 1.0);
        vec3 L = normalize(uLightDir);

        float diff = max(dot(n, L), 0.0);
        vec3 refl = reflect(-viewDir, n);

        // Main sheen bands shift with the light (pointer) direction
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

    function compile(type, src) {
      const sh = gl.createShader(type)
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(sh))
        return null
      }
      return sh
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
      lightDir: gl.getUniformLocation(prog, 'uLightDir'),
      flipX: gl.getUniformLocation(prog, 'uFlipX'),
      normalMap: gl.getUniformLocation(prog, 'uNormalMap'),
    }

    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([128, 128, 255]))
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    const img = new Image()
    img.onload = () => {
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

    // Smoothed light direction following the pointer
    let lx = -0.35, ly = 0.55

    function draw() {
      const rect = canvas.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const px = pointerRef.current.x
      const py = pointerRef.current.y

      let targetX = -0.35
      let targetY = 0.55
      if (px !== null && py !== null) {
        const radius = Math.max(rect.width, rect.height)
        targetX = clampUnit((px - cx) / radius)
        targetY = clampUnit(-(py - cy) / radius)
      }

      lx += (targetX - lx) * 0.1
      ly += (targetY - ly) * 0.1

      gl.uniform2f(uni.resolution, W, H)
      gl.uniform3f(uni.lightDir, lx, ly, 0.75)
      gl.uniform1f(uni.flipX, flipX ? 1.0 : 0.0)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      rafRef.current = requestAnimationFrame(draw)
    }

    function clampUnit(v) {
      return Math.max(-1.4, Math.min(1.4, v))
    }

    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [normalMap, flipX])

  useEffect(() => {
    function onMove(e) {
      pointerRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <div
      className="relative cursor-pointer"
      style={{ width: `${size}px`, height: `${size}px` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-full transition-[box-shadow] duration-300 ease-out"
        style={{ boxShadow: `0 0 0 ${hovered ? 8 : 0}px rgba(255,255,255,0.2)` }}
      />
      <canvas ref={canvasRef} aria-hidden="true" className="h-full w-full" />
    </div>
  )
}
