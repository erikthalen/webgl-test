import utils from '../lib/gl-utils.js'

const vertexShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location = 0) in vec4 aPosition;
layout(location = 1) in vec3 aColor;

out vec3 vColor;

void main() {
  vColor = aColor;
  gl_Position = aPosition;
}`

const fragmentShaderSrc = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

in vec3 vColor;

out vec4 fragColor;

void main() {
  fragColor = vec4(vColor, 1.0);
}`

const canvas = document.querySelector('canvas')
const { gl, program } = utils.setupGl(
  canvas,
  vertexShaderSrc,
  fragmentShaderSrc
)

utils.setCanvasSize(canvas, gl)

gl.clearColor(0.7, 0.9, 0.9, 1.0)
gl.clear(gl.COLOR_BUFFER_BIT)

const transformData = new Float32Array([0, 0.5, -0.5, -0.5, 0.5, -0.5])
const colorData = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])

const aPositionLoc = 0
const aColorLoc = 1

const colorBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW)
gl.vertexAttribPointer(
  aColorLoc,
  3,
  gl.FLOAT,
  false,
  3 * Float32Array.BYTES_PER_ELEMENT,
  0
)
gl.vertexAttribDivisor(aColorLoc, 0)
gl.enableVertexAttribArray(aColorLoc)

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
