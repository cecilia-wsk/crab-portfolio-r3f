import { Effect } from 'postprocessing';
import * as THREE from 'three';
import { wrapEffect } from '@react-three/postprocessing';

/**
 * Fragment shader for the ripple post-processing effect.
 * Replicates the original RippleEffect distortion:
 *   - Radial displacement based on an offscreen canvas texture (tRipple)
 *   - Chromatic aberration (RGB split) using offset UV sampling
 *   - Brightness boost where ripple intensity is high
 *
 * In the postprocessing framework, effects write to `outputColor` via
 * `mainImage(...)` and sample the previous pass from `inputBuffer`.
 */
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

/**
 * Custom postprocessing Effect that carries the ripple data texture.
 * Extends postprocessing's Effect class and is wrapped with R3F's
 * wrapEffect utility so it can be used declaratively inside <EffectComposer>.
 */
class RipplePostEffectImpl extends Effect {
  constructor({ tRipple, distort = new THREE.Vector2(0.001, 0.001) } = {}) {
    super('RipplePostEffectImpl', fragmentShader, {
      uniforms: new Map([
        ['tRipple', new THREE.Uniform(tRipple)],
        ['distort', new THREE.Uniform(distort)],
      ]),
    });
  }
}

export const RipplePostEffect = wrapEffect(RipplePostEffectImpl);
