import utils from '../lib/gl-utils.js'
import { m4 } from '../lib/m4.js'
import { colorData, positionData } from './data-7.js'
import { degToRad } from '../lib/utils.js'

const flipPositionData = positions => {
  var matrix = m4.xRotation(Math.PI)
  matrix = m4.translate(matrix, -50, -75, -15)

  for (var ii = 0; ii < positions.length; ii += 3) {
    var vector = m4.transformVector(matrix, [
      positions[ii + 0],
      positions[ii + 1],
      positions[ii + 2],
      1,
    ])
    positions[ii + 0] = vector[0]
    positions[ii + 1] = vector[1]
    positions[ii + 2] = vector[2]
  }

  return positions
}

const flippedPositionData = flipPositionData(positionData)

const vertexSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location = 0) in vec4 a_position;
layout(location = 1) in vec4 a_color;

uniform mat4 u_matrix;

out vec4 v_color;

void main() {
  gl_Position = u_matrix * a_position;

  v_color = a_color;
}`

const fragmentSrc = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

in vec4 v_color;

out vec4 fragColor;

void main() {
  fragColor = vec4(v_color);
}`

const { gl, program, clearGl, canvas } = utils.setupCanvas(vertexSrc, fragmentSrc)

gl.enable(gl.CULL_FACE)
gl.enable(gl.DEPTH_TEST)

const loc = {
  a: {
    position: 0,
    color: 1,
  },
  u: {
    matrix: gl.getUniformLocation(program, 'u_matrix'),
  },
}

const state = {
  cameraAngle: 0,
}

// load position data
const positionBuffer = gl.createBuffer()
const vao = gl.createVertexArray()
gl.bindVertexArray(vao)
gl.enableVertexAttribArray(loc.a.position)
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, flippedPositionData, gl.STATIC_DRAW)
gl.vertexAttribPointer(loc.a.position, 3, gl.FLOAT, false, 0, 0)

// load color data
const colorBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW)
gl.enableVertexAttribArray(loc.a.color)
gl.vertexAttribPointer(loc.a.color, 3, gl.UNSIGNED_BYTE, true, 0, 0)

const drawScene = () => {
  clearGl()

  const numFs = 5
  const radius = 200

  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
  const zNear = 1
  const zFar = 2000
  const fieldOfViewRadians = degToRad(45)
  const projectionMatrix = m4.perspective(
    fieldOfViewRadians,
    aspect,
    zNear,
    zFar
  )

  // Compute the position of the first F
  const fPosition = [radius, 0, 0]

  // Use matrix math to compute a position on the circle.
  let cameraMatrix = m4.yRotation(state.cameraAngle)
  cameraMatrix = m4.translate(cameraMatrix, 0, 250, radius * 3)

  // Get the camera's position from the matrix we computed
  const cameraPosition = [cameraMatrix[12], cameraMatrix[13], cameraMatrix[14]]

  const up = [0, 1, 0]

  // Compute the camera's matrix using look at.
  const cameraMatrix2 = m4.lookAt(cameraPosition, fPosition, up)

  // Make a view matrix from the camera matrix.
  const viewMatrix = m4.inverse(cameraMatrix2)

  const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix)

  // Draw 'F's in a circle
  for (var ii = 0; ii < numFs; ++ii) {
    var angle = (ii * Math.PI * 2) / numFs

    var x = Math.cos(angle) * radius
    var z = Math.sin(angle) * radius
    // add in the translation for this F
    const matrix = m4.translate(viewProjectionMatrix, x, 0, z)

    // Set the matrix.
    gl.uniformMatrix4fv(loc.u.matrix, false, matrix)

    // Draw the geometry.
    var primitiveType = gl.TRIANGLES
    var offset = 0
    var count = 16 * 6
    gl.drawArrays(primitiveType, offset, count)
  }
}

drawScene()

window.addEventListener('resize', () => {
  utils.setCanvasSize(canvas, gl)
  drawScene()
})

// ui
const pane = new Tweakpane.Pane()
pane.addInput(state, 'cameraAngle', { min: 0, max: Math.PI * 2 })
pane.on('change', drawScene)
