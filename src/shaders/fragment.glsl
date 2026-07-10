uniform vec4 uResolution;

void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  if (length(c) > 0.5) discard;

  float isMobile = step(uResolution.x, 768.0);

  vec4 desktopColor = vec4(1.0, 1.0, 1.0, 0.4);
  vec4 mobileColor  = vec4(1.0, 0.0, 0.0, 0.4);

  gl_FragColor = mix(desktopColor, mobileColor, isMobile);
}
