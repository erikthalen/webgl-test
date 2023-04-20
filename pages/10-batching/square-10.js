export default ({ x, y }, initColor, initSize = 1, speed) => {
  let size = initSize
  let color = initColor
  const pos = { x, y }

  const xIndecies = [0, 5, 10, 15, 20, 25]
  const yIndecies = [1, 6, 11, 16, 21, 26]

  const vertices = [
    -(size / 2) + pos.x, -(size / 2) + pos.y, ...color,
    (size / 2) + pos.x, -(size / 2) + pos.y, ...color,
    -(size / 2) + pos.x, (size / 2) + pos.y, ...color,
    
    -(size / 2) + pos.x, (size / 2) + pos.y, ...color,
    (size / 2) + pos.x, -(size / 2) + pos.y, ...color,
    (size / 2) + pos.x, (size / 2) + pos.y, ...color,
  ]

  return {
    vertices,
    vertexCount: 6,
    setColor(newColor) {},
    resize(newSize) { size = newSize },
    pos,
    moveBy({ x, y }) {
      xIndecies.forEach(xVertex => {
        vertices[xVertex] += x * speed
      })
      yIndecies.forEach(yVertex => {
        vertices[yVertex] += y * speed
      })
    },
  }
}
