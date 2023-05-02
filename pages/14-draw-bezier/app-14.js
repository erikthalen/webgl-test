const box = document.getElementById('box')

const clear = () => {
  box.innerHTML = ''
}

const draw = (p, big, text) => {
  box.insertAdjacentHTML('beforeend', `<div style="left: ${p[0] * 100}%; top: ${100 - p[1] * 100}%;" class="dot ${big ? 'big' : ''}" title="${text || ''}"></div>`)
}

var points = [
  [0, 0.5],   // 
  [0.25, 0.455],
  [0.45, 0.5],
  [0.25, 0.675],
  [0.5, 0.8], // 
  [0.75, 0.675],
  [0.55, 0.5],
  [0.75, 0.455],
  [1, 0.5], // 
]

var spline = new BSpline(points, 4)

clear()

const resolution = 600

for (var t = 0; t <= 1; t += 1 / resolution) {
  var p = spline.calcAt(t)
  draw(p)
}

for (var t = 0; t < points.length; t += 1) {
  draw(points[t], true, t + 1)
}

