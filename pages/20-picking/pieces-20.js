import { getId } from '../../lib/picking.js'
import { getPiece, cache } from './lib/piece.js'

export const makePieces = (gl, loc, pieces, options) => {
  let globalVertexIndex = 0

  const piecesData = pieces.map(({ id, shapes, position, color }, idx) => {
    const VERTICES_PER_ATTRIBUTE = 2 // 2 === 2d / xy

    const objectVertices = getPiece({ shapes, ...options })

    const objectLength =
      objectVertices.triangles.length / VERTICES_PER_ATTRIBUTE

    const ownIndex = globalVertexIndex

    globalVertexIndex += objectLength

    return {
      id: idx,
      bufferIndex: ownIndex,
      objectLength,
      vertices: {
        triangles: objectVertices.triangles,
        object: objectVertices.vertices,
        color: Array(objectLength).fill(color).flat(),
        position: Array(objectLength).fill([position.x, position.y]).flat(),
        active: Array(objectLength).fill(0),
        id: Array(objectLength).fill(getId(idx)).flat(),
      },
    }
  })

  const buffersData = [
    {
      name: 'object',
      attributeLength: 2,
    },
    {
      name: 'triangles',
      attributeLength: 2,
    },
    {
      name: 'color',
      attributeLength: 3,
    },
    {
      name: 'position',
      attributeLength: 2,
    },
    {
      name: 'active',
      attributeLength: 1,
    },
    {
      name: 'id',
      attributeLength: 4,
    },
  ]

  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)

  const buffers = buffersData.reduce((acc, cur) => {
    const dataArray = piecesData.map(piece => piece.vertices[cur.name]).flat()

    const buffer = gl.createBuffer()

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataArray), gl.STATIC_DRAW)

    gl.enableVertexAttribArray(loc.a[cur.name])
    gl.vertexAttribPointer(
      loc.a[cur.name],
      cur.attributeLength,
      gl.FLOAT,
      false,
      0,
      0
    )

    return {
      ...acc,
      [cur.name]: buffer,
    }
  }, {})

  gl.bindVertexArray(null)

  return {
    verticesLength:
      piecesData.map(piece => piece.vertices.triangles).flat().length / 2,
    vao,
    buffers,
    move: (id, position) => {
      const piece = piecesData.find(piece => piece.id === id)
      const newPositionData = Array(piece.objectLength)
        .fill([position.x, position.y])
        .flat()

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        piece.bufferIndex * 2 * Float32Array.BYTES_PER_ELEMENT,
        new Float32Array(newPositionData),
        0
      )
    },
    activate: (id, isActive) => {
      const piece = piecesData.find(piece => piece.id === id - 1)
      const newActiveData = Array(piece.objectLength).fill(isActive ? 1 : 0)

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.active)
      gl.bufferSubData(
        gl.ARRAY_BUFFER,
        piece.bufferIndex * Float32Array.BYTES_PER_ELEMENT,
        new Float32Array(newActiveData),
        0
      )
    },
  }
}
