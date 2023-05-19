import { earcut } from './earcut.js'

export const cache = {}

// const points = [
//   [-1, 0],
//   [-0.5, -0.05],
//   [-0.1, 0],
//   [-0.5, 0.35],
//   [0, 0.6],
//   [0.5, 0.35],
//   [0.1, 0],
//   [0.5, -0.05],
//   [1, 0],
// ]

const points = [
  [-1, 0],
  [-0.5, -0.05],
  [-0.05, 0],
  [-0.5, 0.35],
  [0, 0.66],
  [0.5, 0.35],
  [0.05, 0],
  [0.5, -0.05],
  [1, 0],
]

const flipKnob = out => points => {
  return points.map(([x, y]) => {
    return [x, y * (out ? -1 : 1)]
  })
}

export const setKnobsize = size => points => {
  return points.map(([x, y], idx, arr) => {
    if (idx === 0 || idx === arr.length - 1) {
      return [x, y]
    }

    return [x * size.y, y * size.x]
  })
}

const moveKnob = pos => points => {
  return points.map(([x, y], idx, arr) => {
    if (idx === 0 || idx === arr.length - 1) {
      return [x, y]
    }

    return [x + pos, y]
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
  size = { x: 0.5, y: 0.5 },
  shapes = ['out', 'in', 'out', 'out'],
  knobsize = 1,
  knobrandom = 0,
  center = { x: 0, y: 0 },
  resolution,
  precision = 0.0001,
} = {}) => {
  const cacheKey = shapes.join('')

  if (cache[cacheKey]) return cache[cacheKey]

  const getSpline = points => new BSpline(points, 4)

  const longestSide = Math.max(size.x, size.y)

  const side = (position, vertical, angle, shape) =>
    pipe(
      flipKnob(shape === 'out' ? true : false),
      moveKnob(knobrandom * (Math.random() - 0.5)),
      resizePoints(vertical ? { x: size.y, y: size.x } : size),
      rotatePoints(angle),
      setKnobsize(
        shape === 'flat'
          ? { x: 0, y: 0 }
          : {
              x: (size.x * knobsize) / longestSide,
              y: (size.y * knobsize) / longestSide,
            }
      ),
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

  const vertexPoints = sides.map(getSpline)

  const verticesNested = []

  vertexPoints.forEach(side => {
    for (var t = 0; t <= 1; t += 1 / resolution) {
      const vertex = side.calcAt(t)
      verticesNested.push(vertex)
    }
  })

  const verticesRounded = verticesNested.map(([x, y]) => {
    const pr = 1 / precision
    const rounded = number => Math.round(number * pr) / pr
    return [rounded(x), rounded(y)]
  })

  const vertices = verticesRounded.flat()
  const indexes = earcut(vertices)

  const triangles = []

  for (let i = 0; i < indexes.length; i += 3) {
    const index0 = indexes[i + 0]
    const index1 = indexes[i + 1]
    const index2 = indexes[i + 2]

    const triangle = [
      vertices[index0 * 2 + 0],
      vertices[index0 * 2 + 1],

      vertices[index1 * 2 + 0],
      vertices[index1 * 2 + 1],

      vertices[index2 * 2 + 0],
      vertices[index2 * 2 + 1],
    ]

    triangles.push(triangle)
  }

  const piece = {
    triangles: triangles.flat(),
    vertices,
    indexes,
  }

  cache[cacheKey] = piece

  return piece
}
