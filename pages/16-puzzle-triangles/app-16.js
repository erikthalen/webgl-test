import { getPiece } from './lib/bezier.js'
import utils from './lib/gl-utils.js'
import { m3 } from './lib/m3.js'
import { earcut } from './lib/earcut.js'
import { getRandomColor } from './lib/getRandomColor.js'

const vertexSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec3 a_color;

uniform mat3 u_matrix;

out vec3 v_color;

void main() {
  gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);

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
  },
  u: {
    color: gl.getUniformLocation(program, 'u_color'),
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

// gl.uniform4fv(loc.u.color, [1, 0.3, 0.3, 1])

const state = {
  // world
  origin: { x: 0, y: 0 },
  translation: { x: 0, y: 0 },
  rotation: 0,
  scale: { x: 1, y: 1 },

  resolution: 100,

  // piece
  center: { x: 0, y: 0 },
  size: { x: 0.5, y: 0.45 },
  knobsize: 1,
}

const getVertices = () => {
  const piece = getPiece({
    size: state.size,
    shapes: ['in', 'out', 'in', 'out'],
    knobsize: state.knobsize,
    center: state.center,
  })

  const vertices = []

  piece.forEach(side => {
    for (var t = 0; t <= 1; t += 1 / state.resolution) {
      const vertex = side.calcAt(t)
      vertices.push(vertex)
    }
  })

  return vertices.flat()
}

const vertices = getVertices()
const indexes = earcut(vertices)

const triangles = []

for (let i = 0; i < indexes.length; i += 3) {
  const index0 = indexes[i + 0]
  const index1 = indexes[i + 1]
  const index2 = indexes[i + 2]

  const triangle = [
    vertices[index0 * 2 + 0],
    vertices[index0 * 2 + 1],

    vertices[index1 * 2 + 0],
    vertices[index1 * 2 + 1],

    vertices[index2 * 2 + 0],
    vertices[index2 * 2 + 1],
  ]

  triangles.push(triangle)
}

const trianglesFlattened = triangles.flat()

console.log('triangle count', trianglesFlattened.length / 6)
console.log('vertices', vertices)
console.log('indexes', indexes)
console.log('triangles', trianglesFlattened)

const vao = gl.createVertexArray()
gl.bindVertexArray(vao)

const colorVertices = [...Array(trianglesFlattened.length / 2)]
  .map(() => {
    const color = getRandomColor()
    return [color, color, color]
  })
  .flat(2)

const positionData = new Float32Array(trianglesFlattened)
const positionBuffer = gl.createBuffer()

gl.enableVertexAttribArray(loc.a.position)
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW)
gl.vertexAttribPointer(loc.a.position, 2, gl.FLOAT, false, 0, 0)

const colorData = new Float32Array(colorVertices)
const colorBuffer = gl.createBuffer()
gl.enableVertexAttribArray(loc.a.color)
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW)
gl.vertexAttribPointer(loc.a.color, 3, gl.FLOAT, false, 0, 0)

const drawScene = () => {
  clearGl()
  const matrix = computeMatrix(state)
  gl.uniformMatrix3fv(loc.u.matrix, false, matrix)
  gl.drawArrays(gl.TRIANGLES, 0, trianglesFlattened.length / 2)
}

drawScene()

// ui
const pane = new Tweakpane.Pane()

// pane.addInput(state, 'triangles', { step: 1 })
pane.addInput(state, 'resolution', { step: 10 })
pane.addInput(state, 'size')
pane.addInput(state, 'knobsize')
pane.addInput(state, 'center')

pane.on('change', e => {
  drawScene()
})
