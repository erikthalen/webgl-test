import utils from '../lib/gl-utils.js'
import { m4 } from '../lib/m4.js'
import square from '../square-13.js'
import { vertexSrc, fragmentSrc } from './shaders-13.js'
import { bezier } from './piece-13.js'

const { gl, program, clearGl } = utils.setupCanvas(vertexSrc, fragmentSrc)

gl.enable(gl.CULL_FACE)
gl.enable(gl.DEPTH_TEST)

const loc = {
  a: {
    position: 0,
    size: 1,
    object: 2,

    curve: 3,
  },
  u: {
    color: gl.getUniformLocation(program, 'u_color'),
    matrix: gl.getUniformLocation(program, 'u_matrix'),
    resolution: gl.getUniformLocation(program, 'u_resolution'),
    thickness: gl.getUniformLocation(program, 'u_thickness'),

    ptA: gl.getUniformLocation(program, 'ptA'),
    ptB: gl.getUniformLocation(program, 'ptB'),
    ptC: gl.getUniformLocation(program, 'ptC'),
    ptD: gl.getUniformLocation(program, 'ptD'),
  },
}

gl.uniformMatrix4fv(loc.u.matrix, false, m4.create())
gl.uniform3fv(loc.u.color, new Float32Array([1.0, 0.3, 0.3]))

gl.uniform1f(loc.u.resolution, 15)
gl.uniform1f(loc.u.thickness, 0.002)

const state = {
  pos: { x: 0, y: 0 },
}

let squares = {
  data: [square({ x: -1.5, y: -1.5 }, 3)],
  get(what) {
    return new Float32Array(this.data.map(square => square[what]()).flat())
  },
}

const vao = gl.createVertexArray()
gl.bindVertexArray(vao)

const positionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, squares.get('position'), gl.STATIC_DRAW)
gl.vertexAttribPointer(loc.a.position, 2, gl.FLOAT, false, 0, 0)
gl.enableVertexAttribArray(loc.a.position)

const objectBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, objectBuffer)
gl.bufferData(gl.ARRAY_BUFFER, squares.get('vertices'), gl.STATIC_DRAW)
gl.vertexAttribPointer(loc.a.object, 2, gl.FLOAT, false, 0, 0)
gl.enableVertexAttribArray(loc.a.object)

const sizeBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer)
gl.bufferData(gl.ARRAY_BUFFER, squares.get('size'), gl.STATIC_DRAW)
gl.vertexAttribPointer(loc.a.size, 2, gl.FLOAT, false, 0, 0)
gl.enableVertexAttribArray(loc.a.size)

gl.bindVertexArray(null)

let frame = 0

const drawScene = () => {
  requestAnimationFrame(drawScene)

  const t0 = performance.now()

  clearGl()
  gl.bindVertexArray(vao)
  
  const curve = bezier[frame % 6]

  gl.uniform2fv(loc.u.ptA, new Float32Array([curve[0], curve[1] + 0.5]))
  gl.uniform2fv(loc.u.ptB, new Float32Array([curve[0], curve[1] + 0.5]))
  gl.uniform2fv(loc.u.ptC, new Float32Array([curve[2], curve[3] + 0.5]))
  gl.uniform2fv(loc.u.ptD, new Float32Array([curve[4], curve[5] + 0.5]))

  gl.drawArrays(gl.TRIANGLES, 0, squares.data.length * 6)

  frame++

  const t1 = performance.now()

  console.log(1000 / Math.max(0.001, t1 - t0))
}

drawScene()
