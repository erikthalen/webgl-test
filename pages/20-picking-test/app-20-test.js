import * as twgl from './node_modules/twgl.js/dist/5.x/twgl-full.module.js'
import { flattenedPrimitives } from './flattenedPrimitives.js'
import { m4 } from './lib/m4.js'
import { getId } from '../../lib/picking.js'

const vs = `#version 300 es

in vec4 a_position;
in vec4 a_color;

uniform mat4 u_viewProjection;
uniform mat4 u_world;

out vec4 v_color;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_viewProjection * u_world * a_position;

  // Pass the color to the fragment shader.
  v_color = a_color;
}
`

const fs = `#version 300 es
precision highp float;

// Passed in from the vertex shader.
in vec4 v_color;

uniform vec4 u_colorMult;

out vec4 outColor;

void main() {
   outColor = v_color * u_colorMult;
}
`

const pickingVS = `#version 300 es
  in vec4 a_position;
  
  uniform mat4 u_viewProjection;
  uniform mat4 u_world;
  
  void main() {
    // Multiply the position by the matrix.
    gl_Position = u_viewProjection * u_world * a_position;
  }
`

const pickingFS = `#version 300 es
  precision highp float;
  
  uniform vec4 u_id;

  out vec4 outColor;
  
  void main() {
     outColor = u_id;
  }
`

const canvas = document.getElementById('canvas')
const gl = canvas.getContext('webgl2')

// Tell the twgl to match position with a_position, n
// normal with a_normal etc..
twgl.setAttributePrefix('a_')

// setup GLSL program
// note: we need the attribute positions to match across programs
// so that we only need one vertex array per shape
const options = {
  attribLocations: {
    a_position: 0,
    a_color: 1,
  },
}
const programInfo = twgl.createProgramInfo(gl, [vs, fs], options)
const pickingProgramInfo = twgl.createProgramInfo(
  gl,
  [pickingVS, pickingFS],
  options
)

// creates buffers with position, normal, texcoord, and vertex color
// data for primitives by calling gl.createBuffer, gl.bindBuffer,
// and gl.bufferData
const cubeBufferInfo = flattenedPrimitives.createCubeBufferInfo(gl, 20)
const cubeVAO = twgl.createVAOFromBufferInfo(gl, programInfo, cubeBufferInfo)

function degToRad(d) {
  return (d * Math.PI) / 180
}

function rand(min, max) {
  if (max === undefined) {
    max = min
    min = 0
  }
  return Math.random() * (max - min) + min
}

function eMod(x, n) {
  return x >= 0 ? x % n : (n - (-x % n)) % n
}

const fieldOfViewRadians = degToRad(60)
const near = 1
const far = 2000

const objectsToDraw = []
const objects = []
const viewProjectionMatrix = m4.identity()

// Make infos for each object for each object.
const numObjects = 50
for (let ii = 0; ii < numObjects; ++ii) {
  // pick a shape
  const shape = { bufferInfo: cubeBufferInfo, vertexArray: cubeVAO }

  // make an object.
  const object = {
    uniforms: {
      u_colorMult: [0.3, 1, 0, 9],
      u_world: m4.identity(),
      u_viewProjection: viewProjectionMatrix,
      u_id: getId(ii),
    },
    translation: [rand(-100, 100), rand(-100, 100), -150],
  }

  objects.push(object)

  // Add it to the list of things to draw.
  objectsToDraw.push({
    programInfo: programInfo,
    bufferInfo: shape.bufferInfo,
    vertexArray: shape.vertexArray,
    uniforms: object.uniforms,
  })
}

// Create a texture to render to
const targetTexture = gl.createTexture()
gl.bindTexture(gl.TEXTURE_2D, targetTexture)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

// create a depth renderbuffer
const depthBuffer = gl.createRenderbuffer()
gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer)

function setFramebufferAttachmentSizes(width, height) {
  gl.bindTexture(gl.TEXTURE_2D, targetTexture)
  // define size and format of level 0
  const level = 0
  const internalFormat = gl.RGBA
  const border = 0
  const format = gl.RGBA
  const type = gl.UNSIGNED_BYTE
  const data = null
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    format,
    type,
    data
  )

  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer)
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height)
}
setFramebufferAttachmentSizes(1, 1)

// Create and bind the framebuffer
const fb = gl.createFramebuffer()
gl.bindFramebuffer(gl.FRAMEBUFFER, fb)

// attach the texture as the first color attachment
const attachmentPoint = gl.COLOR_ATTACHMENT0
const level = 0
gl.framebufferTexture2D(
  gl.FRAMEBUFFER,
  attachmentPoint,
  gl.TEXTURE_2D,
  targetTexture,
  level
)

// make a depth buffer and the same size as the targetTexture
gl.framebufferRenderbuffer(
  gl.FRAMEBUFFER,
  gl.DEPTH_ATTACHMENT,
  gl.RENDERBUFFER,
  depthBuffer
)

function computeMatrix(translation) {
  return m4.translation(translation[0], translation[1], translation[2])
}

function drawObjects(objectsToDraw, overrideProgramInfo) {
  objectsToDraw.forEach(function (object) {
    const programInfo = overrideProgramInfo || object.programInfo
    const bufferInfo = object.bufferInfo
    const vertexArray = object.vertexArray

    gl.useProgram(programInfo.program)

    // Setup all the needed attributes.
    gl.bindVertexArray(vertexArray)

    // Set the uniforms.
    twgl.setUniforms(programInfo, object.uniforms)

    // Draw (calls gl.drawArrays or gl.drawElements)
    twgl.drawBufferInfo(gl, object.bufferInfo)
  })
}

// mouseX and mouseY are in CSS display space relative to canvas
let mouseX = -1
let mouseY = -1
let oldPickNdx = -1
let oldPickColor

// Draw the scene.
function drawScene() {
  twgl.resizeCanvasToDisplaySize(gl.canvas)

  // Compute the camera's matrix using look at.
  const cameraPosition = [0, 0, 100]
  const target = [0, 0, 0]
  const up = [0, 1, 0]
  const cameraMatrix = m4.lookAt(cameraPosition, target, up)

  // Make a view matrix from the camera matrix.
  const viewMatrix = m4.inverse(cameraMatrix)

  // Compute the matrices for each object.
  objects.forEach(function (object) {
    object.uniforms.u_world = computeMatrix(object.translation)
  })

  // ------ Draw the objects to the texture --------

  // Figure out what pixel is under the mouse and setup
  // a frustum to render just that pixel

  {
    // compute the rectangle the near plane of our frustum covers
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    const top = Math.tan(fieldOfViewRadians * 0.5) * near
    const bottom = -top
    const left = aspect * bottom
    const right = aspect * top
    const width = Math.abs(right - left)
    const height = Math.abs(top - bottom)

    // compute the portion of the near plane covers the 1 pixel
    // under the mouse.
    const pixelX = (mouseX * gl.canvas.width) / gl.canvas.clientWidth
    const pixelY =
      gl.canvas.height -
      (mouseY * gl.canvas.height) / gl.canvas.clientHeight -
      1

    const subLeft = left + (pixelX * width) / gl.canvas.width
    const subBottom = bottom + (pixelY * height) / gl.canvas.height
    const subWidth = width / gl.canvas.width
    const subHeight = height / gl.canvas.height

    // make a frustum for that 1 pixel
    const projectionMatrix = m4.frustum(
      subLeft,
      subLeft + subWidth,
      subBottom,
      subBottom + subHeight,
      near,
      far
    )
    m4.multiply(projectionMatrix, viewMatrix, viewProjectionMatrix)
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
  gl.viewport(0, 0, 1, 1)

  gl.enable(gl.CULL_FACE)
  gl.enable(gl.DEPTH_TEST)

  // Clear the canvas AND the depth buffer.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  drawObjects(objectsToDraw, pickingProgramInfo)

  // ------ read the 1 pixel

  const data = new Uint8Array(4)
  gl.readPixels(
    0, // x
    0, // y
    1, // width
    1, // height
    gl.RGBA, // format
    gl.UNSIGNED_BYTE, // type
    data
  ) // typed array to hold result
  const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24)

  console.log(id)

  // restore the object's color
  if (oldPickNdx >= 0) {
    const object = objects[oldPickNdx]
    object.uniforms.u_colorMult = oldPickColor
    oldPickNdx = -1
  }

  // highlight object under mouse
  if (id > 0) {
    const pickNdx = id - 1
    oldPickNdx = pickNdx
    const object = objects[pickNdx]
    oldPickColor = object.uniforms.u_colorMult
    object.uniforms.u_colorMult = [1, 1, 0, 1]
  }

  // ------ Draw the objects to the canvas

  {
    // Compute the projection matrix
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    const projectionMatrix = m4.perspective(
      fieldOfViewRadians,
      aspect,
      near,
      far
    )

    m4.multiply(projectionMatrix, viewMatrix, viewProjectionMatrix)
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  drawObjects(objectsToDraw)
}

gl.canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect()
  mouseX = e.clientX - rect.left
  mouseY = e.clientY - rect.top

  drawScene()
})

drawScene()
