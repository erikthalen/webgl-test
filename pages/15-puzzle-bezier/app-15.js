const box = document.getElementById('box')

const clear = () => {
  box.innerHTML = ''
}

const draw = (p, { big, text, color } = {}) => {
  const left = p[0] * 100
  const top = p[1] * 100
  const className = big ? 'big' : ''
  box.insertAdjacentHTML(
    'beforeend',
    `<div
      style="left: ${left}%; top: ${top}%; background: ${color || ''}"
      class="dot ${className}"
      title="${text || ''}">
    </div>`
  )
}


const state = {
  resolution: 80,
  
  rotation: 0,
  center: { x: 0.5, y: 0.5 },
  size: { x: 0.3, y: 0.3 },
  knobsize: 0.9,
}

const points = [
  [-1, 0],
  [-0.5, -0.1],
  [-0.1, 0],
  [-0.5, 0.35],
  [0, 0.6],
  [0.5, 0.35],
  [0.1, 0],
  [0.5, -0.1],
  [1, 0],
]
const flipKnob = out => points => {
  return points.map(([x, y]) => {
    return [x, y * (out ? -1 : 1)]
  })
}

const setKnobsize = size => points => {
  return points.map(([x, y], idx, arr) => {
    if (idx === 0 || idx === arr.length - 1) {
      return [x, y]
    }

    return [x * size, y * size]
  })
}

const movePoints = to => points => {
  return points.map(([x, y]) => {
    return [x + to.x, y + to.y]
  })
}

const resizePoints = size => points => {
  return points.map(([x, y]) => {
    return [x * size.x, y * size.y]
  })
}

const rotatePoints = angle => points => {
  return points.map(point => {
    const deg = (angle * Math.PI) / 180

    return [
      point[0] * Math.cos(deg) - point[1] * Math.sin(deg),
      point[0] * Math.sin(deg) + point[1] * Math.cos(deg),
    ]
  })
}

const pipe =
  (...fns) =>
  x =>
    fns.reduce((v, f) => f(v), x)

const drawScene = () => {
  const getSpline = points => new BSpline(points, 4)

  const side = (position, vertical, angle) =>
    pipe(
      flipKnob(Math.random() > 0.5),
      setKnobsize(Math.random() > 0.85 ? 0 : state.knobsize),
      resizePoints(
        vertical ? { x: state.size.y, y: state.size.x } : state.size
      ),
      rotatePoints(state.rotation + angle),
      movePoints({
        x: state.center.x + position.x,
        y: state.center.y + position.y,
      })
    )(points)

  const sides = [
    {
      points: side({ x: 0, y: -state.size.y }, false, 0),
    },
    {
      points: side({ x: state.size.x, y: 0 }, true, 90),
    },
    {
      points: side({ x: 0, y: state.size.y }, false, 180),
    },
    {
      points: side({ x: -state.size.x, y: 0 }, true, -90),
    },
  ]

  clear()

  sides.forEach((side, idx) => {
    const colors = ['lightgreen', 'dodgerblue', 'lightpink', 'magenta']

    const spline = getSpline(side.points)

    for (var t = 0; t <= 1; t += 1 / state.resolution) {
      var p = spline.calcAt(t)
      draw(p, { color: colors[idx] })
    }

    // draw(side.points[0], { big: true, color: 'red' })
    // draw(side.points[8], { big: true, color: 'red' })
  })
}

drawScene()

// for (var t = 0; t < points.length; t += 1) {
//   draw(points[t], true, t + 1)
// }

// ui
const pane = new Tweakpane.Pane()

pane.addInput(state, 'resolution', { step: 10 })
pane.addInput(state, 'rotation', { step: 10 })
pane.addInput(state, 'size')
pane.addInput(state, 'knobsize')
pane.addInput(state, 'center')

pane.on('change', e => {
  drawScene()
})
