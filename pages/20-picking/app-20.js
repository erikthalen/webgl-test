import utils from './lib/gl-utils.js'
import { m3 } from './lib/m3.js'
import { makePieces } from './pieces-20.js'
import { getRandomColor } from './lib/getRandomColor.js'
import { orbit } from './lib/orbit.js'

const glsl = x => x

const vertexSrc = glsl`#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec3 a_color;
layout(location = 3) in vec2 a_triangles;

uniform vec2 u_resolution;
uniform mat3 u_matrix;

out vec3 v_color;

void main() {
  vec2 uv = ((a_triangles + a_position) / u_resolution.xy) * u_resolution.y;
  gl_Position = vec4(u_matrix * vec3(uv, 1), 1);

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

const { gl, program, canvas } = utils.setupCanvas(vertexSrc, fragmentSrc)

const loc = {
  a: {
    position: 0,
    color: 1,
    object: 2,
    triangles: 3,
  },
  u: {
    matrix: gl.getUniformLocation(program, 'u_matrix'),
    resolution: gl.getUniformLocation(program, 'u_resolution'),
  },
}

const state = {
  // world
  translation: { x: 0, y: 0 },
  rotation: 0,
  zoom: 1,

  amount: 20 ** 2,
}

const defaultOptions = {
  size: { x: 0.5 / Math.sqrt(state.amount), y: 0.48 / Math.sqrt(state.amount) },
  resolution: 200,
  precision: 0.000001,
}

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
          id: idx,
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

const pane = new Tweakpane.Pane()
pane.registerPlugin(TweakpaneEssentialsPlugin)

pane.addMonitor(state, 'amount', { label: 'Pieces' })
pane.addMonitor(state, 'zoom', { label: 'Zoom' })
pane.addMonitor(state.translation, 'x', { label: 'Position X' })
pane.addMonitor(state.translation, 'y', { label: 'Position Y' })
pane.addMonitor(pieces, 'verticesLength', { label: 'Vertices' })

const fpsGraph = pane.addBlade({
  view: 'fpsgraph',
  label: 'FPS',
})

let matrix

const drawScene = () => {
  // requestAnimationFrame(drawScene)
  fpsGraph.begin()

  // clearGl()

  gl.bindVertexArray(pieces.vao)
  gl.drawArrays(gl.TRIANGLES, 0, pieces.verticesLength)

  fpsGraph.end()
}

drawScene()

// interaction
function makeCameraMatrix() {
  const zoomScale = 1 / state.zoom
  return m3.pipe(
    m3.translate(state.translation.x, state.translation.y),
    m3.rotate(state.rotation),
    m3.scale(zoomScale, zoomScale),
    m3.inverse
  )(m3.identity())
}

orbit({
  m3,
  canvas,
  state,
  onUpdate: newMatrix => {
    matrix = makeCameraMatrix()
    gl.uniformMatrix3fv(loc.u.matrix, false, matrix)
    drawScene()
  },
  matrixFunction: makeCameraMatrix,
})

const handleResize = () => {
  utils.setCanvasSize(canvas, gl, 2)
  gl.uniform2fv(loc.u.resolution, [window.innerWidth, window.innerHeight])
  drawScene()
}

handleResize()

window.addEventListener('resize', handleResize)
