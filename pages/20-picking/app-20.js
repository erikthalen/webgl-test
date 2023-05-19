import utils from './lib/gl-utils.js'
import { m3 } from './lib/m3.js'
import { makePieces } from './pieces-20.js'
import { getRandomColor } from './lib/getRandomColor.js'
import { orbit } from './lib/orbit.js'

const glsl = x => x

const vertexSrc = glsl`#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec3 a_color;
layout(location = 3) in vec2 a_triangles;

uniform mat3 u_matrix;

out vec3 v_color;

void main() {
  gl_Position = vec4(u_matrix * vec3(a_triangles + a_position, 1), 1);

  v_color = a_color;
}`

const fragmentSrc = glsl`#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

in vec3 v_color;

out vec4 fragColor;

void main() {
  fragColor = vec4(v_color, 1.0);
}`

const { gl, program, clearGl, canvas } = utils.setupCanvas(
  vertexSrc,
  fragmentSrc
)

const loc = {
  a: {
    position: 0,
    color: 1,
    object: 2,
    triangles: 3,
  },
  u: {
    color: gl.getUniformLocation(program, 'u_color'),
    matrix: gl.getUniformLocation(program, 'u_matrix'),
  },
}

const state = {
  // world
  translation: { x: 0, y: 0 },
  rotation: 0,
  zoom: 1,
}

const amount = 10 ** 2

const defaultOptions = {
  size: { x: 0.5 / Math.sqrt(amount), y: 0.48 / Math.sqrt(amount) },
  resolution: 350,
  precision: 0.000001,
}

const pieces = makePieces(
  gl,
  loc,
  [
    ...Array(amount)
      .fill(0)
      .map((_, idx, arr) => {
        const amount = arr.length
        const rows = Math.sqrt(amount)
        const cols = amount / rows
        const x = ((idx % cols) / cols - 0.5 + defaultOptions.size.x) * 1.85
        const y = (Math.floor(idx / cols) / rows - 0.5 + defaultOptions.size.y) * 1.85

        const shapes = ['out', 'in']

        const piece = {
          id: idx,
          color: getRandomColor(Math.random() * 100 - 50),
          position: { x, y },
          shapes: Array(4)
            .fill(0)
            .map(() => shapes[Math.floor(Math.random() * shapes.length)]),
        }

        return piece
      }),
  ],
  defaultOptions
)

console.log('vertices:', pieces.verticesLength)
console.log('triangles:', pieces.verticesLength / 3)

let matrix

const drawScene = () => {
  clearGl()

  matrix = makeCameraMatrix()

  gl.uniformMatrix3fv(loc.u.matrix, false, matrix)
  gl.bindVertexArray(pieces.vao)
  gl.drawArrays(gl.TRIANGLES, 0, pieces.verticesLength)
}

drawScene()

// interaction
function makeCameraMatrix() {
  const zoomScale = 1 / state.zoom
  return m3.pipe(
    m3.translate(state.translation.x, state.translation.y),
    m3.rotate(state.rotation),
    m3.scale(zoomScale, zoomScale),
    m3.inverse
  )(m3.identity())
}

orbit({
  m3,
  canvas,
  state,
  onUpdate: (newMatrix) => {
    matrix = newMatrix
    drawScene()
  },
  matrixFunction: makeCameraMatrix,
})