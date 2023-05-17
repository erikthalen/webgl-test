import utils from './lib/gl-utils.js'
import { m3 } from './lib/m3.js'
import { makePieces } from './pieces-19.js'
import pan from './lib/pan.js'
import { getRandomColor } from './lib/getRandomColor.js'

const glsl = x => x

const vertexSrc = glsl`#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec3 a_color;
layout(location = 3) in vec2 a_triangles;

uniform mat3 u_matrix;

out vec3 v_color;

void main() {
  gl_Position = vec4(u_matrix * vec3(a_triangles + a_position, 1), 1);

  v_color = a_color;
}`

const fragmentSrc = glsl`#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

in vec3 v_color;

out vec4 fragColor;

void main() {
  fragColor = vec4(v_color, 1.0);
}`

const { gl, program, clearGl, canvas } = utils.setupCanvas(
  vertexSrc,
  fragmentSrc
)

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

const state = {
  // world
  origin: { x: 0, y: 0 },
  translation: { x: 0, y: 0 },
  rotation: 0,
  zoom: 1,

  // piece
  position: { x: 0.05, y: -0.04 },
  position2: { x: -0.05, y: 0.04 },
}

const defaultOptions = {
  size: { x: 0.005, y: 0.0048 },
  resolution: 250,
  precision: 0.000001,
}

let matrix

const computeMatrix = state => {
  const { origin, translation, rotation, scale } = state

  const matrix = m3.pipe(
    m3.translate(origin.x, origin.y),
    m3.rotate(rotation),
    m3.translate(translation.x, translation.y),
    m3.scale(zoom, zoom)
  )(m3.identity())

  return matrix
}

const pieces = makePieces(
  gl,
  loc,
  [
    ...Array(100)
      .fill(0)
      .map((_, idx, arr) => {
        const amount = arr.length
        const rows = Math.sqrt(amount)
        const cols = amount / rows
        const x = ((idx % cols) / cols - 0.49) * 1.85
        const y = (Math.floor(idx / cols) / rows - 0.475) * 1.85

        const shapes = ['out', 'in']

        const piece = {
          id: idx,
          color: getRandomColor(),
          position: { x, y },
          shapes: Array(4)
            .fill(0)
            .map(() => shapes[Math.floor(Math.random() * shapes.length)]),
        }

        return piece
      }),
    // {
    //   id: 4000,
    //   color: [0.3, 0.3, 1],
    //   position: state.position2,
    //   shapes: ['in', 'flat', 'out', 'out'],
    // },
    // {
    //   id: 4010,
    //   color: [1, 0.3, 0.3],
    //   position: state.position,
    //   shapes: ['in', 'out', 'in', 'out'],
    // },
  ],
  defaultOptions
)

console.log('vertices:', pieces.verticesLength)
console.log('triangles:', pieces.verticesLength / 3)

const drawScene = () => {
  clearGl()
  matrix = computeMatrix(state)
  gl.uniformMatrix3fv(loc.u.matrix, false, matrix)

  gl.bindVertexArray(pieces.vao)

  gl.drawArrays(gl.TRIANGLES, 0, pieces.verticesLength)
}

drawScene()

// interaction
// pan(canvas)

// canvas.addEventListener('pan', ({ detail }) => {
//   state.translation = {
//     x: detail.position.x / 1000,
//     y: -detail.position.y / 1000,
//   }
//   state.scale = { x: detail.scale, y: detail.scale }

//   drawScene()
// })

let viewProjectionMat

function makeCameraMatrix() {
  const zoomScale = 1 / camera.zoom
  let cameraMat = m3.identity()
  cameraMat = m3.translate(cameraMat, camera.x, camera.y)
  cameraMat = m3.rotate(cameraMat, camera.rotation)
  cameraMat = m3.scale(cameraMat, zoomScale, zoomScale)
  return cameraMat
}

function updateViewProjection() {
  // same as ortho(0, width, height, 0, -1, 1)
  const projectionMat = m3.projection(gl.canvas.width, gl.canvas.height)
  const cameraMat = makeCameraMatrix()
  let viewMat = m3.inverse(cameraMat)
  viewProjectionMat = m3.multiply(projectionMat, viewMat)
}

function getClipSpaceMousePosition(e) {
  // get normalized 0 to 1 position across and down canvas
  const normalizedX = e.offsetX / canvas.clientWidth
  const normalizedY = e.offsetY / canvas.clientHeight

  // convert to clip space
  const clipX = normalizedX * 2 - 1
  const clipY = normalizedY * -2 + 1

  return [clipX, clipY]
}

canvas.addEventListener('wheel', e => {
  e.preventDefault()
  const [clipX, clipY] = getClipSpaceMousePosition(e)

  // position before zooming
  const [preZoomX, preZoomY] = m3.transformPoint(
    m3.inverse(viewProjectionMat),
    [clipX, clipY]
  )

  // multiply the wheel movement by the current zoom level
  // so we zoom less when zoomed in and more when zoomed out
  const newZoom = state.zoom * Math.pow(2, e.deltaY * -0.01)
  state.zoom = Math.max(0.02, Math.min(100, newZoom))

  updateViewProjection()

  // position after zooming
  const [postZoomX, postZoomY] = m3.transformPoint(
    m3.inverse(viewProjectionMat),
    [clipX, clipY]
  )

  // camera needs to be moved the difference of before and after
  camera.x += preZoomX - postZoomX
  camera.y += preZoomY - postZoomY

  drawScene()
})

// ui
const pane = new Tweakpane.Pane()

pane.addInput(state, 'position', { x: { step: 0.01 }, y: { step: 0.01 } })

pane.on('change', e => {
  pieces.move(1, state.position)
  drawScene()
})
