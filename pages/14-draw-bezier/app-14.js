import { setKnobsize } from '../../lib/piece.js'

const box = document.getElementById('box')

const clear = () => {
  box.innerHTML = ''
}

const draw = (p, big, text) => {
  box.insertAdjacentHTML(
    'beforeend',
    `<div style="left: ${p[0] * 50 + 50}%; top: ${
      50 - p[1] * 50
    }%;" class="dot ${big ? 'big' : ''}" title="${text || ''}"></div>`
  )
}

const state = {
  knobsize: 1,
}

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

const drawPoints = () => {
  const resizedPoints = setKnobsize({ x: state.knobsize, y: state.knobsize })(
    points
  )

  var spline = new BSpline(resizedPoints, 4)

  clear()

  const resolution = 600

  for (var t = 0; t <= 1; t += 1 / resolution) {
    var p = spline.calcAt(t)
    draw(p)
  }

  for (var t = 0; t < resizedPoints.length; t += 1) {
    draw(resizedPoints[t], true, t + 1)
  }
}

drawPoints()

const pane = new Tweakpane.Pane()

pane.addInput(state, 'knobsize', { step: 0.01 })

pane.on('change', e => {
  drawPoints()
})
