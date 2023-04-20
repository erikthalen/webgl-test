import utils from '../lib/gl-utils.js'
import { m4 } from '../lib/m4.js'
import { colorData, positionData } from './data-5.js'

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

const { gl, program, clearGl } = utils.setupCanvas(vertexSrc, fragmentSrc)

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
  translation: { x: 350, y: 150, z: 0 },
  rotation: { x: 0.4, y: 0.6, z: 0 },
  scale: { x: 2, y: 2, z: 2 },
}

const computeMatrix = state => {
  const { translation, rotation, scale } = state

  const left = 0
  const right = gl.canvas.clientWidth
  const bottom = gl.canvas.clientHeight
  const top = 0
  const near = 400
  const far = -400

  var matrix = m4.orthographic(left, right, bottom, top, near, far)
  matrix = m4.translate(matrix, translation.x, translation.y, translation.z)
  matrix = m4.xRotate(matrix, rotation.x)
  matrix = m4.yRotate(matrix, rotation.y)
  matrix = m4.zRotate(matrix, rotation.z)
  matrix = m4.scale(matrix, scale.x, scale.y, scale.z)

  return matrix
}

// load position data
const positionBuffer = gl.createBuffer()
const vao = gl.createVertexArray()
gl.bindVertexArray(vao)
gl.enableVertexAttribArray(loc.a.position)
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW)
gl.vertexAttribPointer(loc.a.position, 3, gl.FLOAT, false, 0, 0)

// load color data
const colorBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW)
gl.enableVertexAttribArray(loc.a.color)
gl.vertexAttribPointer(loc.a.color, 3, gl.UNSIGNED_BYTE, true, 0, 0)

const count = 16 * 6

const drawScene = () => {
  clearGl()
  const matrix = computeMatrix(state)
  gl.uniformMatrix4fv(loc.u.matrix, false, matrix)
  gl.drawArrays(gl.TRIANGLES, 0, count)
}

drawScene()

// ui
const pane = new Tweakpane.Pane()

pane.addInput(state, 'translation', {
  x: { min: -200, max: gl.canvas.clientWidth, step: 10 },
  y: { min: -100, max: gl.canvas.clientHeight, step: 10, inverted: true },
  z: { min: -300, max: 300, step: 10 },
  picker: 'inline',
})
pane.addInput(state, 'rotation', {
  x: { min: 0, max: Math.PI * 2 },
  y: { min: 0, max: Math.PI * 2 },
  z: { min: 0, max: Math.PI * 2 },
})
pane.addInput(state, 'scale', {
  x: { min: -2, max: 2 },
  y: { min: -2, max: 2 },
  picker: 'inline',
})

pane.on('change', drawScene)
