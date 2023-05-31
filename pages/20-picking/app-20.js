import utils from './lib/gl-utils.js'
import { m3 } from './lib/m3.js'
import { makePieces } from './pieces-20.js'
import { getRandomColor } from './lib/getRandomColor.js'
import { orbit } from './lib/orbit.js'
import {
  vertexSrc,
  fragmentSrc,
  vertexPickSrc,
  fragmentPickSrc,
} from './shaders.js'
import { getId } from './lib/picking.js'

const canvas = document.querySelector('canvas')
const gl = canvas.getContext('webgl2')

utils.setCanvasSize(canvas, gl, 2)

const program = utils.setupProgram(gl, vertexSrc, fragmentSrc)

gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

const pickProgram = utils.setupProgram(gl, vertexPickSrc, fragmentPickSrc)

/**
 * gl locations
 */
const loc = {
  a: {
    position: 0,
    color: 1,
    triangles: 2,
    id: 3,
  },
  u: {
    matrix: gl.getUniformLocation(program, 'u_matrix'),
    resolution: gl.getUniformLocation(program, 'u_resolution'),

    pickMatrix: gl.getUniformLocation(pickProgram, 'u_matrix'),
    pickResolution: gl.getUniformLocation(pickProgram, 'u_resolution'),
  },
}

/**
 * world state
 */
const state = {
  // world
  translation: { x: 0, y: 0 },
  rotation: 0,
  zoom: 1,

  // pieces
  amount: 10 ** 2,

  mouseX: 0,
  mouseY: 0,

  hovered: -1
}

const defaultOptions = {
  size: {
    x: 0.5 / Math.sqrt(state.amount),
    y: 0.48 / Math.sqrt(state.amount),
  },
}

let matrix = makeCameraMatrix()

/**
 * objects
 */
const pieces = makePieces(
  gl,
  loc,
  [
    ...Array(state.amount)
      .fill(0)
      .map((_, idx, arr) => {
        const rows = Math.sqrt(arr.length)
        const cols = arr.length / rows
        const { size } = defaultOptions
        const x = ((idx % cols) / cols - 0.5 + size.x) * 1.8
        const y = (Math.floor(idx / cols) / rows - 0.5 + size.y) * 1.8

        const shapes = ['out', 'in']

        const piece = {
          id: getId(idx),
          color: getRandomColor(Math.random() * 70 + 200),
          position: { x, y },
          shapes: [...Array(4)].map(
            () => shapes[Math.floor(Math.random() * shapes.length)]
          ),
        }

        return piece
      }),
  ],
  defaultOptions
)

/**
 * picking
 */
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

setFramebufferAttachmentSizes(gl.canvas.width, gl.canvas.height)

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

/**
 * stats
 */
const pane = new Tweakpane.Pane()
pane.registerPlugin(TweakpaneEssentialsPlugin)

pane.addMonitor(state, 'amount', { label: 'Pieces' })
pane.addMonitor(state, 'hovered', { label: 'Hovered', interval: 20 })
pane.addMonitor(state, 'zoom', { label: 'Zoom' })
pane.addMonitor(state.translation, 'x', { label: 'Position X' })
pane.addMonitor(state.translation, 'y', { label: 'Position Y' })
pane.addMonitor(pieces, 'verticesLength', { label: 'Vertices' })

const fpsGraph = pane.addBlade({
  view: 'fpsgraph',
  label: 'FPS',
})

/**
 * render
 */
const drawScene = () => {
  fpsGraph.begin()

  gl.bindVertexArray(pieces.vao)

  gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
  // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  gl.enable(gl.CULL_FACE)
  // gl.enable(gl.DEPTH_TEST)

  // Clear the canvas AND the depth buffer.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // draw to frame buffer
  gl.useProgram(pickProgram)
  gl.uniformMatrix3fv(loc.u.pickMatrix, false, matrix)
  gl.uniform2fv(loc.u.pickResolution, [window.innerWidth, window.innerHeight])
  gl.drawArrays(gl.TRIANGLES, 0, pieces.verticesLength)

  /**
   * read pixel under mouse
   */
  const pixelX = (state.mouseX * gl.canvas.width) / gl.canvas.clientWidth
  const pixelY =
    gl.canvas.height -
    (state.mouseY * gl.canvas.height) / gl.canvas.clientHeight -
    1

  const data = new Uint8Array(4)

  // console.log(pixelX, pixelY)

  gl.readPixels(
    pixelX, // x
    pixelY, // y
    1, // width
    1, // height
    gl.RGBA, // format
    gl.UNSIGNED_BYTE, // type
    data
  ) // typed array to hold result

  const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24)

  if (id > 0) {
    state.hovered = id
  } else {
    state.hovered = -1
  }

  // ------ Draw the objects to the canvas

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  //
  gl.useProgram(program)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.uniformMatrix3fv(loc.u.matrix, false, matrix)
  gl.uniform2fv(loc.u.resolution, [window.innerWidth, window.innerHeight])
  gl.drawArrays(gl.TRIANGLES, 0, pieces.verticesLength)

  fpsGraph.end()
}

// drawScene()

/**
 * camera
 */
function makeCameraMatrix() {
  const zoomScale = 1 / state.zoom
  return m3.pipe(
    m3.translate(state.translation.x, state.translation.y),
    m3.rotate(state.rotation),
    m3.scale(zoomScale, zoomScale),
    m3.inverse
  )(m3.identity())
}

/**
 * orbit
 */
orbit({
  m3,
  canvas,
  state,
  onUpdate: newMatrix => {
    matrix = makeCameraMatrix()
    drawScene()
  },
  matrixFunction: makeCameraMatrix,
})

/**
 * resize
 */
const handleResize = () => {
  utils.setCanvasSize(canvas, gl, 2)
  drawScene()
}

handleResize()
window.addEventListener('resize', handleResize)

/**
 * mousemove
 */
gl.canvas.addEventListener('mousemove', e => {
  state.mouseX = e.offsetX
  state.mouseY = e.offsetY

  drawScene()
})
