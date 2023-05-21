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
    matrix: gl.getUniformLocation(program, 'u_matrix'),
    resolution: gl.getUniformLocation(program, 'u_resolution'),
  },
}

const state = {
  // world
  translation: { x: 0, y: 0 },
  rotation: 0,
  zoom: 1,

  amount: 25 ** 2,
}

const defaultOptions = {
  size: { x: 0.5 / Math.sqrt(state.amount), y: 0.48 / Math.sqrt(state.amount) },
  resolution: 150,
  precision: 0.000001,
}

const pieces = makePieces(
  gl,
  loc,
  [
    ...Array(state.amount)
      .fill(0)
      .map((_, idx, arr) => {
        const amount = arr.length
        const rows = Math.sqrt(amount)
        const cols = amount / rows
        const x = ((idx % cols) / cols - 0.5 + defaultOptions.size.x) * 1.85
        const y =
          (Math.floor(idx / cols) / rows - 0.5 + defaultOptions.size.y) * 1.85

        const shapes = ['out', 'in']

        const piece = {
          id: idx,
          color: getRandomColor(Math.random() * 360 + 100),
          position: { x, y },
          shapes: Array(4)
            .fill(0)
            .map(() => shapes[Math.floor(Math.random() * shapes.length)]),
        }

        return piece
      }),
  ],
  defaultOptions
)

const pane = new Tweakpane.Pane()
pane.registerPlugin(TweakpaneEssentialsPlugin)

pane.addMonitor(state, 'amount')
pane.addMonitor(state, 'zoom', { interval: 10 })
pane.addMonitor(state.translation, 'x', { interval: 10 })
pane.addMonitor(state.translation, 'y', { interval: 10 })
pane.addMonitor(pieces, 'verticesLength')

const fpsGraph = pane.addBlade({
  view: 'fpsgraph',
  label: 'fpsgraph',
})

let matrix

const drawScene = () => {
  // requestAnimationFrame(drawScene)
  fpsGraph.begin()

  clearGl()

  utils.setCanvasSize(canvas, gl)

  matrix = makeCameraMatrix()

  gl.uniformMatrix3fv(loc.u.matrix, false, matrix)
  gl.uniform2fv(loc.u.resolution, [window.innerWidth, window.innerHeight])

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
    matrix = newMatrix
    drawScene()
  },
  matrixFunction: makeCameraMatrix,
})
