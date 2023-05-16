// input: h in [0,360] and s,v in [0,1] - output: r,g,b in [0,1]
function hsl2rgb(h, s = 0.8, l = 0.8) {
  let a = s * Math.min(l, 1 - l)
  let f = (n, k = (n + h / 30) % 12) =>
    l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
  return [f(0), f(8), f(4)]
}

export const getRandomColor = () => {
  const hue = Math.random() * 360
  return hsl2rgb(hue)
}
