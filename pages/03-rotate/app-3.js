import utils from '../lib/gl-utils.js'

const vertexSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location = 0) in vec2 a_position;

uniform vec2 u_rotation;

void main() {
  vec2 rotatedPosition = vec2(
    a_position.x * u_rotation.y + a_position.y * u_rotation.x,
    a_position.y * u_rotation.y - a_position.x * u_rotation.x);
    
  gl_Position = vec4(rotatedPosition, 0, 1);
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

const aPositionLoc = 0
const uColorLoc = gl.getUniformLocation(program, 'u_color')
const rotationLocation = gl.getUniformLocation(program, 'u_rotation')

const rotation = [0, 1]

gl.uniform4fv(uColorLoc, [1, 0.3, 0.3, 1])
gl.uniform2fv(rotationLocation, rotation)

const positionData = new Float32Array([
  -0.5, 0.5,
  -0.5, -0.5,
  0.5, 0.5,
  
  -0.5, -0.5,
  0.5, -0.5,
  0.5, 0.5,
])
const positionBuffer = gl.createBuffer()
const vao = gl.createVertexArray()
gl.bindVertexArray(vao)
gl.enableVertexAttribArray(aPositionLoc)
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW)

gl.vertexAttribPointer(
  aPositionLoc,
  2,
  gl.FLOAT,
  false,
  2 * Float32Array.BYTES_PER_ELEMENT,
  0
)

gl.drawArrays(gl.TRIANGLES, 0, 6)

// ui
const pane = new Tweakpane.Pane()
const input = pane.addInput({ rotate: 0 }, 'rotate', { min: 0, max: 1, step: 0.01 })

input.on('change', ev => {
  clearGl()

  const x = Math.sin(ev.value * Math.PI * 2)
  const y = Math.cos(ev.value * Math.PI * 2)

  const output = [x, y]

  gl.uniform2fv(rotationLocation, output)
  gl.drawArrays(gl.TRIANGLES, 0, 6)
})
