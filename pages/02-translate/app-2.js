import utils from '../lib/gl-utils.js'

const vertexShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location = 0) in vec2 aPosition;

uniform float u_transform;

void main() {
  gl_Position = vec4(aPosition.x + u_transform, aPosition.y, 0, 1);
}`

const fragmentShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

uniform vec4 u_color;

out vec4 fragColor;

void main() {
  fragColor = vec4(u_color);
}`

const { gl, program, clearGl } = utils.setupCanvas(
  vertexShaderSrc,
  fragmentShaderSrc
)

const transformData = new Float32Array([0, 0.5, -0.5, -0.5, 0.5, -0.5])

const aPositionLoc = 0
const uColorLoc = gl.getUniformLocation(program, 'u_color')
const uTransformLoc = gl.getUniformLocation(program, 'u_transform')

let x = 0
gl.uniform4fv(uColorLoc, [1, 0.3, 0.3, 1])
gl.uniform1f(uTransformLoc, x)

const transformBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, transformBuffer)
gl.bufferData(gl.ARRAY_BUFFER, transformData, gl.STATIC_DRAW)
gl.vertexAttribPointer(
  aPositionLoc,
  2,
  gl.FLOAT,
  false,
  2 * Float32Array.BYTES_PER_ELEMENT,
  0
)
gl.enableVertexAttribArray(aPositionLoc)

gl.drawArrays(gl.TRIANGLES, 0, 3)

const pane = new Tweakpane.Pane()
const input = pane.addInput({ transform: x }, 'transform', {
  min: -1,
  max: 1,
  step: 0.01,
})

input.on('change', ev => {
  clearGl()

  gl.uniform1f(uTransformLoc, ev.value)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
})
