const setupGl = (canvas, vert, frag) => {
  const gl = canvas.getContext('webgl2')

  const program = gl.createProgram()

  const vertexShader = gl.createShader(gl.VERTEX_SHADER)
  gl.shaderSource(vertexShader, vert)
  gl.compileShader(vertexShader)
  gl.attachShader(program, vertexShader)

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
  gl.shaderSource(fragmentShader, frag)
  gl.compileShader(fragmentShader)
  gl.attachShader(program, fragmentShader)

  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader))
    console.log(gl.getShaderInfoLog(fragmentShader))
  }

  gl.useProgram(program)

  return { gl, program, canvas }
}

const setupCanvas = (vertex, fragment) => {
  const canvas = document.querySelector('canvas')
  const { gl, program } = setupGl(
    canvas,
    vertex,
    fragment
  )

  setCanvasSize(canvas, gl)

  const clearColor = [0.98, 0.98, 0.98, 1.0]

  gl.clearColor(...clearColor)
  gl.clear(gl.COLOR_BUFFER_BIT)
  
  return {
    gl,
    program,
    canvas,
    clearGl: () => {
      gl.clearColor(...clearColor)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    },
  }
}

export const setCanvasSize = (canvas, gl, multiplier = window.devicePixelRatio) => {
  const width = (canvas.clientWidth * multiplier) | 0
  const height = (canvas.clientHeight * multiplier) | 0

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    return true
  }

  return false
}

export default {
  setupGl,
  setCanvasSize,
  setupCanvas,
}
