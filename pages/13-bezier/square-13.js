export default ({ x, y }, initSize) => {
  const vertices = [0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]
  let position = Array(6).fill([x, y]).flat()
  let size = Array(12).fill(initSize)

  return {
    vertices() {
      return vertices
    },

    position() {
      return position
    },

    size() {
      return size
    },

    vertexCount: 6,

    moveBy({ x, y }) {
      // position = position.map((pos, idx) => {
      //   if (idx % 2 === 0) {
      //     return pos + x
      //   }

      //   return pos + y
      // })
    },
  }
}
