export const vertexSrc = `#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec3 a_color;
layout(location = 3) in vec2 a_triangles;

uniform vec2 u_resolution;
uniform mat3 u_matrix;

out vec3 v_color;

void main() {
  vec2 uv = ((a_triangles + a_position) / u_resolution.xy) * min(u_resolution.x, u_resolution.y);
  gl_Position = vec4(u_matrix * vec3(uv, 1), 1);

  v_color = a_color;
}`

export const fragmentSrc = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

in vec3 v_color;

out vec4 fragColor;

void main() {
  fragColor = vec4(v_color, 1.0);
}`
