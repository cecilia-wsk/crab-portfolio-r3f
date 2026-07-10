void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  if (length(c) > 0.5) discard;
  gl_FragColor = vec4(1.0, 1., 1., 0.6);
}
