import utils from './lib/gl-utils.js'
import { m3 } from './lib/m3.js'
import { makePieces } from './pieces-17.js'
import { getRandomColor } from './lib/getRandomColor.js'

const vertexSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_color;
layout(location = 2) in vec3 a_object;
layout(location = 3) in vec3 a_triangles;

uniform mat3 u_matrix;

out vec3 v_color;

void main() {
  gl_Position = vec4(u_matrix * a_triangles + a_position, 1.0);

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
    triangles: 3,
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

const state = {
  // world
  origin: { x: 0, y: 0 },
  translation: { x: 0, y: 0 },
  rotation: 0,
  scale: { x: 1, y: 1 },

  // piece
  size: { x: 0.035, y: 0.035 },
  knobsize: 1,

  resolution: 100,
  precision: 0.0001,

  // movement
  animatedPosition: { x: -0.5, y: 0.45 },
  position: { x: 0.5, y: -0.45 },
}

const defaultOptions = {
  size: state.size,
  knobsize: state.knobsize,
  resolution: state.resolution,
  precision: state.precision,
}

const pieces = makePieces(
  gl,
  loc,
  [
    ...Array(236)
      .fill(0)
      .map((_, idx, arr) => {
        const amount = arr.length
        const rows = Math.sqrt(amount)
        const cols = amount / rows
        const x = ((idx % cols) / cols - 0.49) * 1.85
        const y = (Math.floor(idx / cols) / rows - 0.475) * 1.85

        const shapes = ['out', 'in', 'flat']

        const piece = {
          id: idx,
          color: [0.8, 0.8, 0.8], // getRandomColor(),
          position: { x, y },
          shapes: Array(4)
            .fill(0)
            .map(() => shapes[Math.floor(Math.random() * shapes.length)]),
        }

        return piece
      }),
    {
      id: 4000,
      color: [0.3, 0.3, 1],
      position: state.animatedPosition,
      shapes: ['in', 'flat', 'out', 'out'],
    },
    {
      id: 4010,
      color: [1, 0.3, 0.3],
      position: state.position,
      shapes: ['in', 'out', 'in', 'out'],
    },
  ],
  defaultOptions
)

console.log('vertices:', pieces.verticesLength)

const drawScene = () => {
  clearGl()
  const matrix = computeMatrix(state)
  gl.uniformMatrix3fv(loc.u.matrix, false, matrix)

  gl.bindVertexArray(pieces.vao)

  // gl.drawElements(gl.TRIANGLES, pieces.verticesLength, gl.UNSIGNED_SHORT, 0)
  gl.drawArrays(gl.TRIANGLES, 0, pieces.verticesLength)
}

drawScene()

let position = state.animatedPosition
let velocity = { x: 0.01, y: 0.003 }

const tick = () => {
  const t0 = performance.now()
  position.x += velocity.x
  position.y += velocity.y

  if (position.x >= 1 || position.x <= -1) velocity.x *= -1
  if (position.y >= 1 || position.y <= -1) velocity.y *= -1

  // ;[...Array(800).keys()].map(idx => {
  //   pieces.move(idx, position)
  // })

  pieces.move(4000, position)

  drawScene()

  console.log(performance.now() - t0)
  requestAnimationFrame(tick)
}

tick()

// ui
const pane = new Tweakpane.Pane()

pane.addInput(state, 'position', { x: { step: 0.001 }, y: { step: 0.001 } })

pane.on('change', e => {
  pieces.move(4010, state.position)
  drawScene()
})
