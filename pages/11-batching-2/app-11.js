import utils from '../lib/gl-utils.js'
import { m4 } from '../lib/m4.js'
import square from './square-11.js'

const vertexSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location = 0) in vec4 a_position;
layout(location = 1) in vec3 a_color;
layout(location = 2) in vec4 a_object;

uniform mat4 u_matrix;
uniform vec4 u_color;

out vec3 v_color;

void main() {
  gl_Position = u_matrix * a_object + a_position;

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
    object: 2,
  },
  u: {
    color: gl.getUniformLocation(program, 'u_color'),
    matrix: gl.getUniformLocation(program, 'u_matrix'),
  },
}

gl.uniformMatrix4fv(loc.u.matrix, false, m4.create())

const red = [1, 0.6, 0.6]
const green = [0.6, 1, 0.6]
const blue = [0.6, 0.6, 1]

const colors = [red, green, blue]

const state = {
  amount: 7500,
  pos: { x: 0, y: 0 },
}

const randomColor = () => colors[Math.floor(colors.length * Math.random())]
const randomSize = () => Math.random() * 0.1
const randomSpeed = () => Math.random()

const createSquares = () =>
  Array(state.amount)
    .fill(0)
    .map(() =>
      square(
        { x: Math.random() * 4 - 2, y: Math.random() * 4 - 2 },
        randomColor(),
        randomSize(),
        randomSpeed()
      )
    )

let squares = createSquares()

const positionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array(squares.map(square => square.getPosition()).flat()),
  gl.STATIC_DRAW
)

const colorBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array(squares.map(square => square.getColor()).flat()),
  gl.STATIC_DRAW
)

const objectBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, objectBuffer)
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array(squares.map(square => square.vertices).flat()),
  gl.STATIC_DRAW
)

console.log(squares)

const drawScene = () => {
  requestAnimationFrame(drawScene)
  // const t0 = performance.now()

  clearGl()

  squares.forEach(square => {
    square.moveBy({
      x: 0.1,
      y: 0.1,
    })
  })

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(squares.map(square => square.getPosition()).flat()),
    gl.STATIC_DRAW
  )
  gl.enableVertexAttribArray(loc.a.position)
  gl.vertexAttribPointer(loc.a.position, 2, gl.FLOAT, false, 0, 0)

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  gl.enableVertexAttribArray(loc.a.color)
  gl.vertexAttribPointer(loc.a.color, 3, gl.FLOAT, false, 0, 0)

  gl.bindBuffer(gl.ARRAY_BUFFER, objectBuffer)
  gl.enableVertexAttribArray(loc.a.object)
  gl.vertexAttribPointer(loc.a.object, 2, gl.FLOAT, false, 0, 0)

  gl.drawArrays(gl.TRIANGLES, 0, squares.length * 6)

  // const t1 = performance.now()
  // const fps = 1000 / (t1 - t0)
  // const time = (t1 - t0)

  // console.log('fps rendering:', fps, time)
}

drawScene()

// ui
const pane = new Tweakpane.Pane()

pane.addInput(state, 'amount')
pane.addInput(state, 'pos', { y: { inverted: true } })

let lastX = state.pos.x
let lastY = state.pos.y

pane.on('change', e => {
  if (e.presetKey === 'amount') {
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
