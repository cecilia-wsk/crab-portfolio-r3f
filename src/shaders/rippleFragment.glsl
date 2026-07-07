varying vec2 vUv;

uniform sampler2D tDiffuse;
uniform sampler2D tRipple;
uniform vec2 distort;

void main() {
  // DEBUG: show FBO contents directly so we can see if ripples are being rendered
  gl_FragColor = vec4(texture2D(tRipple, vUv).rgb, 1.0);

  // Original compositing (restore after debug):
  // vec3 ripple = texture2D(tRipple, vUv).rgb;
  // vec2 distortOffset = normalize(vUv.xy - ripple.xy) * ripple.b + distort;
  // gl_FragColor = vec4(
  //   ripple.b + texture2D(tDiffuse, vUv + distortOffset).r,
  //   ripple.b + texture2D(tDiffuse, vUv).g,
  //   ripple.b + texture2D(tDiffuse, vUv - distortOffset).b,
  //   1.0
  // );
}
