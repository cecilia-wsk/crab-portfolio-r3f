varying vec2 vUv;

uniform sampler2D tDiffuse;
uniform sampler2D tRipple;
uniform vec2 distort;

void main() {
  vec3 ripple = texture2D(tRipple, vUv).rgb;
  vec2 distortOffset = normalize(vUv.xy - ripple.xy) * ripple.b + distort;
  gl_FragColor = vec4(
    texture2D(tDiffuse, vUv + distortOffset).r,
    texture2D(tDiffuse, vUv).g,
    texture2D(tDiffuse, vUv - distortOffset).b,
    1.0
  );
}
