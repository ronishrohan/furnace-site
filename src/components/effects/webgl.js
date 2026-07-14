export const FULLSCREEN_VERTEX_SHADER = `
  attribute vec2 aPos;
  void main() {
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`

function compileShader(gl, type, source) {
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  if (!vertexShader || !fragmentShader) {
    if (vertexShader) gl.deleteShader(vertexShader)
    if (fragmentShader) gl.deleteShader(fragmentShader)
    return null
  }

  const program = gl.createProgram()
  if (!program) {
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    return null
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }

  gl.useProgram(program)
  return program
}

export function createFullscreenQuad(gl, program) {
  const buffer = gl.createBuffer()
  if (!buffer) return null

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  )

  const position = gl.getAttribLocation(program, 'aPos')
  if (position < 0) {
    gl.deleteBuffer(buffer)
    return null
  }

  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  return buffer
}

export function loadTexture(
  gl,
  source,
  {
    placeholder = [128, 128, 255],
    onLoad,
    onError,
  } = {},
) {
  const texture = gl.createTexture()
  if (!texture) return null

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGB,
    1,
    1,
    0,
    gl.RGB,
    gl.UNSIGNED_BYTE,
    new Uint8Array(placeholder),
  )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  let active = true
  const image = new Image()
  image.onload = () => {
    if (!active || gl.isContextLost?.()) return
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image)
    onLoad?.(image)
  }
  image.onerror = () => {
    if (active) onError?.()
  }
  image.src = source

  return {
    texture,
    cancel() {
      active = false
      image.onload = null
      image.onerror = null
    },
  }
}

export function cancelTextureLoads(resources) {
  resources.textureLoads?.forEach((load) => load?.cancel())
}

export function disposeGLResources(gl, resources) {
  cancelTextureLoads(resources)
  resources.textures?.forEach((texture) => texture && gl.deleteTexture(texture))
  resources.buffers?.forEach((buffer) => buffer && gl.deleteBuffer(buffer))
  resources.programs?.forEach((program) => program && gl.deleteProgram(program))
}

export function releaseWebGLContext(gl) {
  gl?.getExtension?.('WEBGL_lose_context')?.loseContext()
}

export function scheduleWebGLContextRelease(gl) {
  const timer = setTimeout(() => releaseWebGLContext(gl), 0)
  return () => clearTimeout(timer)
}
