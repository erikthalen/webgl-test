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
      id: id || idx,
      bufferIndex: ownIndex,
      objectLength,
      vertices: {
        triangles: objectVertices.triangles,
        object: objectVertices.vertices,
        color: Array(objectLength).fill(color).flat(),
        position: Array(objectLength).fill([position.x, position.y]).flat(),
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
  ]

  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)

  const buffers = buffersData.reduce((acc, cur) => {
    const indexBuffer = cur.name === 'index'
    const bufferTarget = indexBuffer ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER
    const dataArray = piecesData.map(piece => piece.vertices[cur.name]).flat()
    const data = indexBuffer
      ? new Uint16Array(dataArray)
      : new Float32Array(dataArray)

    const buffer = gl.createBuffer()

    gl.bindBuffer(bufferTarget, buffer)
    gl.bufferData(bufferTarget, data, gl.STATIC_DRAW)

    if (!indexBuffer) {
      gl.enableVertexAttribArray(loc.a[cur.name])
      gl.vertexAttribPointer(
        loc.a[cur.name],
        cur.attributeLength,
        gl.FLOAT,
        false,
        0,
        0
      )
    }

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
  }
}
