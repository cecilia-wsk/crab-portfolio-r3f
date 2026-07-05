import { Effect } from 'postprocessing';
import * as THREE from 'three';

const fragmentShader = `
  uniform sampler2D tRipple;
  uniform vec2 distort;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 ripple = texture2D(tRipple, uv).rgb;
    vec2 distortOffset = normalize(uv.xy - ripple.xy) * ripple.b + distort;

    outputColor = vec4(
      ripple.b + texture2D(inputBuffer, uv + distortOffset).r,
      ripple.b + texture2D(inputBuffer, uv).g,
      ripple.b + texture2D(inputBuffer, uv - distortOffset).b,
      1.0
    );
  }
`;

export class RipplePostEffect extends Effect {
  constructor({ tRipple, distort = new THREE.Vector2(0.001, 0.001) } = {}) {
    super('RipplePostEffect', fragmentShader, {
      uniforms: new Map([
        ['tRipple', new THREE.Uniform(tRipple)],
        ['distort', new THREE.Uniform(distort)],
      ]),
    });
  }
}
