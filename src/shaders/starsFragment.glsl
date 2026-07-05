void main() {
  vec3 color = vec3(1.0, 1.0, 1.0);
  vec2 circCoord = gl_PointCoord - vec2(0.5);
  if (length(circCoord * 2.0) - 0.5 > 0.0) discard;
  gl_FragColor = vec4(color, 1.0);
}
