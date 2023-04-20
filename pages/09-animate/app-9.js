import utils from '../lib/gl-utils.js'
import { m4 } from '../lib/m4.js'
import { colorData, positionData } from './data-9.js'

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
  origin: { x: -50, y: -75, z: 0 },
  translation: { x: 450, y: 275, z: 0 },
  rotation: { x: 0.4, y: 0.6, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
}

const computeMatrix = state => {
  const { translation, rotation, scale, origin } = state

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
  matrix = m4.translate(matrix, origin.x, origin.y, origin.z)
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

const PARAMS = {
  cap: 60,
  fps: 0,
}

const loop = t1 => t2 => {
  if (t2 - t1 > 1000 / PARAMS.cap) {
    requestAnimationFrame(loop(t2))
    
    PARAMS.fps = 1000 / (t2 - t1)
    
    // do stuff
    state.rotation.y = (state.rotation.y + 0.02) % (Math.PI * 2)
    state.rotation.z = (state.rotation.z - 0.003) % (Math.PI * 2)
    
    drawScene()
  } else {
    requestAnimationFrame(loop(t1))
  }
}

drawScene()

loop(0)(0)

const pane = new Tweakpane.Pane()
pane.addInput(PARAMS, 'cap', { min: 1, max: 120, step: 1 })
pane.addMonitor(PARAMS, 'fps')
