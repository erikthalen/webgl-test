import * as twgl from './node_modules/twgl.js/dist/5.x/twgl-full.module.js'

// this function takes a set of indexed vertices
// It deindexed them. It then adds random vertex
// colors to each triangle. Finally it passes
// the result to createBufferInfoFromArrays and
// returns a twgl.BufferInfo
function createFlattenedVertices(gl, vertices, vertsPerColor) {
  let last
  return twgl.createBufferInfoFromArrays(
    gl,
    twgl.primitives.makeRandomVertexColors(
      twgl.primitives.deindexVertices(vertices),
      {
        vertsPerColor: vertsPerColor || 1,
        rand: function (ndx, channel) {
          if (channel === 0) {
            last = (128 + Math.random() * 128) | 0
          }
          return channel < 3 ? last : 255
        },
      }
    )
  )
}

function createFlattenedFunc(createVerticesFunc, vertsPerColor) {
  return function (gl) {
    const arrays = createVerticesFunc.apply(
      null,
      Array.prototype.slice.call(arguments, 1)
    )
    return createFlattenedVertices(gl, arrays, vertsPerColor)
  }
}

// These functions make primitives with semi-random vertex colors.
// This means the primitives can be displayed without needing lighting
// which is important to keep the samples simple.

export const flattenedPrimitives = {
  createCubeBufferInfo: createFlattenedFunc(
    twgl.primitives.createCubeVertices,
    6
  ),
}
