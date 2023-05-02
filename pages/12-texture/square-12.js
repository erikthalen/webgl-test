export default ({ x, y }, texture) => {
  const vertices = [
    0, 0,
    1, 0,
    0, 1,
    
    0, 1,
    1, 0,
    1, 1,
  ]

  let position = Array(6).fill([x, y]).flat()
  let size = Array(12).fill(0.5)

  return {
    vertices,
    textureVertices: vertices,
    
    vertexCount: 6,

    getPosition() {
      return position
    },
    
    moveBy({ x, y }) {
      position = position.map((pos, idx) => {
        if(idx % 2 === 0) {
          return pos + x
        }
        
        return pos + y
      })
    },
  }
}
