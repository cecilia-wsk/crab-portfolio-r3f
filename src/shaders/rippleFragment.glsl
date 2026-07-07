varying vec2 vUv;

uniform sampler2D tDiffuse;
uniform sampler2D tRipple;
uniform vec2 distort;

void main() {
  vec3 ripple = texture2D(tRipple, vUv).rgb;
  vec2 distortOffset = normalize(vUv.xy - ripple.xy) * ripple.b + distort;
  // vec2 toCenter = vUv.xy - ripple.xy;
  // float len = length(toCenter);
  // vec2 dir = len > 0.0001 ? normalize(toCenter) : vec2(0.0);
  // vec2 distortOffset = dir * ripple.b + distort;

  gl_FragColor = vec4(
    ripple.b + texture2D(tDiffuse, vUv + distortOffset).r,
    ripple.b + texture2D(tDiffuse, vUv).g,
    ripple.b + texture2D(tDiffuse, vUv - distortOffset).b,
    1.0
  );
}
