const points = [
  [-1, 0],
  [-0.5, -0.05],
  [-0.1, 0],
  [-0.5, 0.35],
  [0, 0.6],
  [0.5, 0.35],
  [0.1, 0],
  [0.5, -0.05],
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

export const getPiece = ({
  size,
  shapes,
  knobsize,
  center = { x: 0, y: 0 },
} = {}) => {
  const getSpline = points => new BSpline(points, 4)

  const side = (position, vertical, angle, shape) =>
    pipe(
      flipKnob(shape === 'out' ? true : false),
      setKnobsize(shape === 'flat' ? 0 : knobsize),
      resizePoints(vertical ? { x: size.y, y: size.x } : size),
      rotatePoints(angle),
      movePoints({
        x: center.x + position.x,
        y: center.y + position.y,
      })
    )(points)

  const sides = [
    side({ x: 0, y: -size.y }, false, 0, shapes[0]),
    side({ x: size.x, y: 0 }, true, 90, shapes[1]),
    side({ x: 0, y: size.y }, false, 180, shapes[2]),
    side({ x: -size.x, y: 0 }, true, -90, shapes[3]),
  ]

  return sides.map(getSpline)
}
