const glsl = x => x

/**
 *
 */
export const vertexSrc = glsl`#version 300 es
  #pragma vscode_glsllint_stage: vert
  // vertex shader

  layout(location = 0) in vec4 a_position;
  layout(location = 1) in vec3 a_size;
  layout(location = 2) in vec4 a_object;
  layout(location = 3) in vec4 a_curve;

  uniform mat4 u_matrix;
  uniform vec3 u_color;

  out vec2 v_uv;
  out vec3 v_color;

  void main() {
    gl_Position = u_matrix * a_object * vec4(a_size, 1.0) + a_position;

    v_uv = a_object.xy;
    v_color = u_color;
  }
`

/**
 *
 */
export const fragmentSrc = glsl`#version 300 es
  #pragma vscode_glsllint_stage: frag
  // fragment shader

  precision mediump float;

  uniform vec2 ptA;
  uniform vec2 ptB;
  uniform vec2 ptC;
  uniform vec2 ptD;

  uniform float u_thickness;
  uniform float u_resolution;

  in vec2 v_uv;

  out vec4 fragColor;

  float line(vec2 p, vec2 a, vec2 b) {
      vec2 pa = p - a, ba = b - a;
      float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
      return length( pa - ba*h ) < u_thickness ? 1.0 : 0.0;
  }

  float bezier(vec2 uv, vec2 p1, vec2 p2, vec2 p3, vec2 p4, float segments) {
    float col;
    vec2 lastPoint = p1;
  
    for(float i = 0.0; i < 1.0; i += 1.0 / u_resolution) {
      vec2 q0 = mix(p1, p2, i);
      vec2 q1 = mix(p2, p3, i);
      vec2 q2 = mix(p3, p4, i);
  
      vec2 r0 = mix(q0, q1, i);
      vec2 r1 = mix(q1, q2, i);
  
      vec2 p_int = mix(r0, r1, i);
      
      col += line(v_uv, lastPoint, p_int);
  
      lastPoint = p_int;
    }
  
    col += line(v_uv, lastPoint, p4);

    return col;
  }

  void main() {
    float col = bezier(v_uv, ptA, ptB, ptC, ptD, u_resolution);
    
    fragColor = vec4(1.0 - col, 1.0 - col, col, 1.0);
  }
`
