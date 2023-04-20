import utils from '../lib/gl-utils.js'
import { m3 } from '../lib/m3.js'

const vertexSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location = 0) in vec2 a_position;

uniform mat3 u_matrix;

void main() {
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
}`

const fragmentSrc = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

uniform vec4 u_color;

out vec4 fragColor;

void main() {
  fragColor = vec4(u_color);
}`

const { gl, program, clearGl } = utils.setupCanvas(vertexSrc, fragmentSrc)

const loc = {
  a: {
    position: 0,
  },
  u: {
    color: gl.getUniformLocation(program, 'u_color'),
    matrix: gl.getUniformLocation(program, 'u_matrix'),
  },
}

const state = {
  origin: { x: 0, y: 0 },
  translation: { x: 0, y: 0 },
  rotation: 0,
  scale: { x: 1, y: 1 },
}

const computeMatrix = state => {
  const { origin, translation, rotation, scale } = state

  const matrix = m3.pipe(
    m3.translate(origin.x, origin.y),
    m3.rotate(rotation),
    m3.translate(translation.x, translation.y),
    m3.scale(scale.x, scale.y)
  )(m3.identity())

  // const matrix = m3.multiply(translationMatrix, rotationMatrix, moveOriginMatrix, scaleMatrix)

  return matrix
}

gl.uniform4fv(loc.u.color, [1, 0.3, 0.3, 1])

const positionData = new Float32Array([
  -0.5, 0.5,
  -0.5, -0.5,
  -0.3, 0.5,
  
  -0.3, 0.5,
  -0.3, -0.5,
  -0.5, -0.5,

  -0.3, 0.5,
  0.5, 0.5,
  -0.3, 0.3,

  0.5, 0.5,
  0.5, 0.3,
  -0.3, 0.3,
  
  -0.3, 0.1,
  0.2, 0.1,
  0.2, -0.1,

  0.2, -0.1,
  -0.3, 0.1,
  -0.3, -0.1
])
const positionBuffer = gl.createBuffer()
const vao = gl.createVertexArray()
gl.bindVertexArray(vao)
gl.enableVertexAttribArray(loc.a.position)
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW)

gl.vertexAttribPointer(
  loc.a.position,
  2,
  gl.FLOAT,
  false,
  2 * Float32Array.BYTES_PER_ELEMENT,
  0
)

const drawScene = () => {
  clearGl()
  const matrix = computeMatrix(state)
  gl.uniformMatrix3fv(loc.u.matrix, false, matrix)
  gl.drawArrays(gl.TRIANGLES, 0, 18)
}

drawScene()

// ui
const pane = new Tweakpane.Pane()

pane.addInput(state, 'origin', {
  x: { min: -1, max: 1 },
  y: { min: -1, max: 1, inverted: true },
  picker: 'inline',
  expanded: true,
})
pane.addInput(state, 'translation', {
  x: { min: -1, max: 1 },
  y: { min: -1, max: 1, inverted: true },
  picker: 'inline',
  expanded: true,
})
pane.addInput(state, 'rotation', { min: 0, max: Math.PI * 2 })
pane.addInput(state, 'scale', {
  x: { min: -2, max: 2 },
  y: { min: -2, max: 2 },
  picker: 'inline',
  expanded: true,
})

pane.on('change', drawScene)
