export default ({ x, y }, initColor, initSize = 1, speed) => {
  const size = initSize

  const vertices = [
    -(size / 2), -(size / 2),
    (size / 2), -(size / 2),
    -(size / 2), (size / 2),
    
    -(size / 2), (size / 2),
    (size / 2), -(size / 2),
    (size / 2), (size / 2),
  ]

  let position = Array(6).fill([x, y]).flat()
  let color = Array(6).fill(initColor).flat()

  let velocityX = Math.random() * 2 - 1 
  let velocityY = Math.random() * 2 - 1

  return {
    vertices,
    vertexCount: 1,

    getPosition() {
      return position
    },

    getColor() {
      return color
    },
    
    setColor(newColor) {},
    resize(newSize) { size = newSize },
    moveBy({ x, y }) {
      position = position.map((pos, idx) => {
        if(idx % 2 === 0) {
          if(pos <= -2) velocityX = 1
          if(pos >= 2) velocityX = -1
          
          return pos + x * size * velocityX
        }
        
        if(pos <= -2) velocityY = 1
        if(pos >= 2) velocityY = -1

        return pos + y * size * velocityY
      })
    },
  }
}
