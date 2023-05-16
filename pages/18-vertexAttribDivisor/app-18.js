import utils from './lib/gl-utils.js'
import { m3 } from './lib/m3.js'

const vertexSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec3 a_color;
layout(location = 2) in vec2 a_object;

uniform mat3 u_matrix;

out vec3 v_color;

void main() {
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy + vec2(a_object), 0, 1);

  v_color = a_color;
}`

const fragmentSrc = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

in vec3 v_color;

out vec4 fragColor;

void main() {
  fragColor = vec4(v_color, 1.0);
}`

const { gl, program, clearGl } = utils.setupCanvas(vertexSrc, fragmentSrc)

const loc = {
  a: {
    position: 0,
    color: 1,
    object: 2,
  },
  u: {
    matrix: gl.getUniformLocation(program, 'u_matrix'),
  },
}

const computeMatrix = state => {
  const { origin, translation, rotation, scale } = state

  const matrix = m3.pipe(
    m3.translate(origin.x, origin.y),
    m3.rotate(rotation),
    m3.translate(translation.x, translation.y),
    m3.scale(scale.x, scale.y)
  )(m3.identity())

  return matrix
}

const state = {
  // world
  origin: { x: 0, y: 0 },
  translation: { x: 0, y: 0 },
  rotation: 0,
  scale: { x: 1, y: 1 },

  position: { x: 0, y: 0 },
}

const vao = gl.createVertexArray()
gl.bindVertexArray(vao)

const colorData = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])
const colorBuffer = gl.createBuffer()
gl.enableVertexAttribArray(loc.a.color)
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW)
gl.vertexAttribPointer(loc.a.color, 3, gl.FLOAT, false, 0, 0)
gl.vertexAttribDivisor(loc.a.color, 1)

const positionData = new Float32Array([
  state.position.x,
  state.position.y,
  0.2,
  0.2,

  -0.5,
  0.5,
  -0.5,
  0.2,
])
const positionBuffer = gl.createBuffer()
gl.enableVertexAttribArray(loc.a.position)
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW)
gl.vertexAttribPointer(loc.a.position, 2, gl.FLOAT, false, 0, 0)
gl.vertexAttribDivisor(loc.a.position, 1)

const objectData = new Float32Array([
  0, 0.5, -0.5, -0.5, 0.5, -0.5, 0.6, 0.6, 0.5, 0.5, 0.5, 0.6,
])
const objectBuffer = gl.createBuffer()
gl.enableVertexAttribArray(loc.a.object)
gl.bindBuffer(gl.ARRAY_BUFFER, objectBuffer)
gl.bufferData(gl.ARRAY_BUFFER, objectData, gl.STATIC_DRAW)
gl.vertexAttribPointer(loc.a.object, 2, gl.FLOAT, false, 0, 0)

const drawScene = () => {
  clearGl()
  const matrix = computeMatrix(state)
  gl.uniformMatrix3fv(loc.u.matrix, false, matrix)

  const positionData = new Float32Array([
    state.position.x,
    state.position.y,
    0.2,
    0.2,

    -0.5,
    0.5,
    -0.5,
    0.2,
  ])

  gl.enableVertexAttribArray(loc.a.position)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW)

  gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 3)
}

drawScene()

// ui
const pane = new Tweakpane.Pane()

pane.addInput(state, 'position', { x: { step: 0.01 }, y: { step: 0.01 } })

pane.on('change', e => {
  drawScene()
})
