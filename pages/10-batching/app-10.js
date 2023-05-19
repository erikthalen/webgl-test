import { getRandomColor } from '../../lib/getRandomColor.js'
import utils from '../lib/gl-utils.js'
import { m4 } from '../lib/m4.js'
import { colorData, positionData } from './data-10.js'
import square from './square-10.js'

const vertexSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location = 0) in vec4 a_position;
layout(location = 1) in vec3 a_color;

uniform mat4 u_matrix;
uniform vec4 u_color;

out vec3 v_color;

void main() {
  gl_Position = u_matrix * a_position;

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

gl.enable(gl.CULL_FACE)
gl.enable(gl.DEPTH_TEST)

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

gl.uniformMatrix4fv(loc.u.matrix, false, m4.create())

const state = {
  amount: 2000,
  pos: { x: -0.4, y: -0.2 },
  pos2: { x: 0.3, y: 0.2 },
}

const randomSize = () => Math.random() * 0.05
const randomSpeed = () => Math.random()

const createSquares = () => Array(state.amount)
  .fill(0)
  .map(() =>
    square(
      { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 },
      getRandomColor(Math.random() * 100 + 100),
      randomSize(),
      randomSpeed()
    )
  )

let squares = createSquares()

// load position data
const positionBuffer = gl.createBuffer()
const vao = gl.createVertexArray()
gl.bindVertexArray(vao)
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
// gl.bufferData(gl.ARRAY_BUFFER, squares(), gl.STATIC_DRAW)

gl.enableVertexAttribArray(loc.a.position)
gl.vertexAttribPointer(loc.a.position, 2, gl.FLOAT, false, 5 * 4, 0)

gl.enableVertexAttribArray(loc.a.color)
gl.vertexAttribPointer(loc.a.color, 3, gl.FLOAT, false, 5 * 4, 2 * 4)

const drawScene = () => {
  const t0 = performance.now()
  clearGl()
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(squares.map(square => square.vertices).flat()),
    gl.STATIC_DRAW
  )
  gl.drawArrays(gl.TRIANGLES, 0, squares.length * 6)
  const t1 = performance.now()
  const fps = 1000 / (t1 - t0)
  if (fps < 40) {
    console.log('fps rendering:', fps)
  }
}

drawScene()

// console.log('float32array', new Float32Array([1,2,3,4]))

// ui
const pane = new Tweakpane.Pane()

pane.addInput(state, 'amount')
pane.addInput(state, 'pos', { y: { inverted: true } })

let lastX = state.pos.x
let lastY = state.pos.y

pane.on('change', e => {
  if(e.presetKey === 'amount') {
    squares = createSquares()
  }
  
  const t0 = performance.now()

  const deltaX = state.pos.x - lastX
  const deltaY = state.pos.y - lastY
  lastX = state.pos.x
  lastY = state.pos.y

  squares.forEach(square => {
    square.moveBy({
      x: deltaX,
      y: deltaY,
    })
  })

  const t1 = performance.now()
  // console.log('fps updating:', 1000 / (t1 - t0))

  drawScene()
})
