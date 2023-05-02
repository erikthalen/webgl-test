import utils from '../lib/gl-utils.js'
import { m4 } from '../lib/m4.js'
import square from '../square-12.js'
import { loadImage } from './lib/load-image.js'

const vertexSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location = 0) in vec4 a_position;
layout(location = 1) in vec3 a_color;
layout(location = 2) in vec4 a_object;
layout(location = 3) in vec2 a_texcoord;

uniform mat4 u_matrix;
uniform vec4 u_color;

out vec2 v_texcoord;
out vec3 v_color;

void main() {
  gl_Position = u_matrix * a_object + a_position;

  v_texcoord = a_texcoord;
  v_color = a_color;
}`

const fragmentSrc = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

in vec2 v_texcoord;
in vec3 v_color;

uniform sampler2D u_texture;

out vec4 fragColor;

void main() {
  fragColor = texture(u_texture, v_texcoord);
}`

const image = await loadImage('/beach.jpg')

const { gl, program, clearGl } = utils.setupCanvas(vertexSrc, fragmentSrc)

gl.enable(gl.CULL_FACE)
gl.enable(gl.DEPTH_TEST)
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

const loc = {
  a: {
    position: 0,
    color: 1,
    object: 2,
    texcoord: 3,
  },
  u: {
    color: gl.getUniformLocation(program, 'u_color'),
    matrix: gl.getUniformLocation(program, 'u_matrix'),
  },
}

gl.uniformMatrix4fv(loc.u.matrix, false, m4.create())

const state = {
  pos: { x: 0, y: 0 },
}

const createSquares = () => [
  square({ x: -1.5, y: -0.5 }),
  square({ x: 0.5, y: -0.5 }),
]

let squares = createSquares()

const positionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array(squares.map(square => square.getPosition()).flat()),
  gl.STATIC_DRAW
)

const objectBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, objectBuffer)
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array(squares.map(square => square.vertices).flat()),
  gl.STATIC_DRAW
)

// create the texcoord buffer, make it the current ARRAY_BUFFER
// and copy in the texcoord values
var texcoordBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array(squares.map(square => square.textureVertices).flat()),
  gl.STATIC_DRAW
)

// Create a texture.
var texture = gl.createTexture()

// use texture unit 0
gl.activeTexture(gl.TEXTURE0 + 0)

// bind to the TEXTURE_2D bind point of texture unit 0
gl.bindTexture(gl.TEXTURE_2D, texture)
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
gl.generateMipmap(gl.TEXTURE_2D)

// gl.bindTexture(gl.TEXTURE_2D, texture);
// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);

console.log(squares)

const drawScene = () => {
  clearGl()

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(squares.map(square => square.getPosition()).flat()),
    gl.STATIC_DRAW
  )
  gl.enableVertexAttribArray(loc.a.position)
  gl.vertexAttribPointer(loc.a.position, 2, gl.FLOAT, false, 0, 0)

  gl.bindBuffer(gl.ARRAY_BUFFER, objectBuffer)
  gl.enableVertexAttribArray(loc.a.object)
  gl.vertexAttribPointer(loc.a.object, 2, gl.FLOAT, false, 0, 0)

  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)
  // Turn on the attribute
  gl.enableVertexAttribArray(loc.a.texcoord)
  // Tell the attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
  gl.vertexAttribPointer(loc.a.texcoord, 2, gl.FLOAT, false, 0, 0)

  gl.drawArrays(gl.TRIANGLES, 0, squares.length * 6)
}

drawScene()

// ui
const pane = new Tweakpane.Pane()

pane.addInput(state, 'pos', { y: { inverted: true } })

let lastX = state.pos.x
let lastY = state.pos.y

pane.on('change', e => {
  const deltaX = state.pos.x - lastX
  const deltaY = state.pos.y - lastY
  lastX = state.pos.x
  lastY = state.pos.y

  squares[0].moveBy({
    x: deltaX,
    y: deltaY,
  })

  drawScene()
})
