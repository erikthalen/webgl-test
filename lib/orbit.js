export const orbit = ({ m3, canvas, onUpdate, state, matrixFunction }) => {
  const normalize = (canvas, [x, y]) => {
    return [x / canvas.clientWidth, y / canvas.clientHeight]
  }

  const clipSpace = ([x, y]) => {
    return [x * 2 - 1, y * -2 + 1]
  }

  const zoom = ({ state, focal, amount, matrixFunction }) => {
    const [clipX, clipY] = clipSpace(focal)

    const matrix = matrixFunction()

    // position before zooming
    const [preZoomX, preZoomY] = m3.transformPoint(m3.inverse(matrix), [
      clipX,
      clipY,
    ])

    const newZoom = state.zoom * Math.pow(2, amount * -0.015)
    state.zoom = Math.max(0.01, Math.min(200, newZoom))

    const newMatrix = matrixFunction()

    // position after zooming
    const [postZoomX, postZoomY] = m3.transformPoint(m3.inverse(newMatrix), [
      clipX,
      clipY,
    ])

    // camera needs to be moved the difference of before and after
    state.translation.x += preZoomX - postZoomX
    state.translation.y += preZoomY - postZoomY

    return newMatrix
  }

  const move = ({ state, amount, matrixFunction }) => {
    state.translation.x += amount[0] / state.zoom
    state.translation.y += amount[1] / -state.zoom
    return matrixFunction()
  }

  /**
   * 
   */
  canvas.addEventListener('wheel', e => {
    e.preventDefault()

    const [deltaX, deltaY] = normalize(canvas, [e.deltaX, e.deltaY])
    const [offsetX, offsetY] = normalize(canvas, [e.offsetX, e.offsetY])

    let matrix

    if (e.ctrlKey) {
      matrix = zoom({
        state,
        focal: [offsetX, offsetY],
        amount: e.deltaY,
        matrixFunction,
      })
    } else {
      matrix = move({
        state,
        amount: [deltaX, deltaY],
        matrixFunction,
      })
    }

    onUpdate(matrix)
  })
}
