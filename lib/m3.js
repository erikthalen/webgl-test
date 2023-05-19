export const m3 = {
  multiplyOne(a, b) {
    const a00 = a[0 * 3 + 0]
    const a01 = a[0 * 3 + 1]
    const a02 = a[0 * 3 + 2]
    const a10 = a[1 * 3 + 0]
    const a11 = a[1 * 3 + 1]
    const a12 = a[1 * 3 + 2]
    const a20 = a[2 * 3 + 0]
    const a21 = a[2 * 3 + 1]
    const a22 = a[2 * 3 + 2]
    const b00 = b[0 * 3 + 0]
    const b01 = b[0 * 3 + 1]
    const b02 = b[0 * 3 + 2]
    const b10 = b[1 * 3 + 0]
    const b11 = b[1 * 3 + 1]
    const b12 = b[1 * 3 + 2]
    const b20 = b[2 * 3 + 0]
    const b21 = b[2 * 3 + 1]
    const b22 = b[2 * 3 + 2]

    return [
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ]
  },

  multiply(initialMatrix, ...matricies) {
    return matricies.reduce((acc, cur) => {
      return this.multiplyOne(acc, cur)
    }, initialMatrix)
  },

  translation(tx, ty) {
    return [
      1, 0, 0,
      0, 1, 0,
      tx, ty, 1
    ]
  },

  rotation(angleInRadians) {
    const c = Math.cos(angleInRadians)
    const s = Math.sin(angleInRadians)
    return [
      c, -s, 0,
      s, c, 0,
      0, 0, 1
    ]
  },

  scaling(sx, sy) {
    return [
      sx, 0, 0,
      0, sy, 0,
      0, 0, 1
    ]
  },

  identity() {
    return [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ]
  },

  projection(width, height) {
    // Note: This matrix flips the Y axis so that 0 is at the top.
    return [
      2 / width, 0, 0,
      0, 2 / height, 0,
      -1, 1, 1,
    ];
  },

  translate: (tx, ty) => (m) => {
    return m3.multiplyOne(m, m3.translation(tx, ty));
  },
 
  rotate: (angleInRadians) => (m) => {
    return m3.multiplyOne(m, m3.rotation(angleInRadians));
  },
 
  scale: (sx, sy) => (m) => {
    return m3.multiplyOne(m, m3.scaling(sx, sy));
  },

  pipe: (...fns) => (m) => fns.reduce((v, f) => f(v), m),

  transformPoint(m, v) {
    var v0 = v[0];
    var v1 = v[1];
    var d = v0 * m[0 * 3 + 2] + v1 * m[1 * 3 + 2] + m[2 * 3 + 2];
    return [
      (v0 * m[0 * 3 + 0] + v1 * m[1 * 3 + 0] + m[2 * 3 + 0]) / d,
      (v0 * m[0 * 3 + 1] + v1 * m[1 * 3 + 1] + m[2 * 3 + 1]) / d,
    ];
  },

  inverse(m, dst) {
    dst = dst || new Float32Array(9);

    const m00 = m[0 * 3 + 0];
    const m01 = m[0 * 3 + 1];
    const m02 = m[0 * 3 + 2];
    const m10 = m[1 * 3 + 0];
    const m11 = m[1 * 3 + 1];
    const m12 = m[1 * 3 + 2];
    const m20 = m[2 * 3 + 0];
    const m21 = m[2 * 3 + 1];
    const m22 = m[2 * 3 + 2];

    const b01 =  m22 * m11 - m12 * m21;
    const b11 = -m22 * m10 + m12 * m20;
    const b21 =  m21 * m10 - m11 * m20;

    const det = m00 * b01 + m01 * b11 + m02 * b21;
    const invDet = 1.0 / det;

    dst[0] = b01 * invDet;
    dst[1] = (-m22 * m01 + m02 * m21) * invDet;
    dst[2] = ( m12 * m01 - m02 * m11) * invDet;
    dst[3] = b11 * invDet;
    dst[4] = ( m22 * m00 - m02 * m20) * invDet;
    dst[5] = (-m12 * m00 + m02 * m10) * invDet;
    dst[6] = b21 * invDet;
    dst[7] = (-m21 * m00 + m01 * m20) * invDet;
    dst[8] = ( m11 * m00 - m01 * m10) * invDet;

    return dst;
  }
}
