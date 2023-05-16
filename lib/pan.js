export const clamp = (val, min, max) => {
  return Math.max(min, Math.min(max, val))
}

let scale = 1
let position = { x: 0, y: 0 }

export const move = ({ x, y }) => {
  position.x = position.x + x
  position.y = position.y + y

  return { position, scale }
}

export const zoom = ({ focal, zoom, max = 1000000, min = 0.05 }) => {
  const atMax = scale === max || scale === min

  scale = clamp(scale * zoom, min, max)

  // const at = {
  //   x: atMax ? position.x : focal.x,
  //   y: atMax ? position.y : focal.y,
  // }

  // position.x = at.x - (at.x - position.x) * zoom
  // position.y = at.y - (at.y - position.y) * zoom

  return { position, scale }
}

export const restore = canvas => {
  const ctx = canvas.getContext('2d')
  clear(ctx)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

export default (target, { dpi = window.devicePixelRatio } = {}) => {
  const dispatch = detail => {
    target.dispatchEvent(
      new CustomEvent('pan', {
        detail,
        bubbles: true,
        cancelable: true,
        composed: false,
      })
    )
  }

  target.addEventListener('wheel', e => {
    e.preventDefault()

    if (e.ctrlKey) {
      dispatch(
        zoom({
          focal: { x: e.offsetX * dpi, y: e.offsetY * dpi },
          zoom: 1 - e.deltaY / 100,
        })
      )
    } else {
      dispatch(move({ x: -e.deltaX, y: -e.deltaY }))
    }
  })
}
