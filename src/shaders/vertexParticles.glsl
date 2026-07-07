uniform float uTime;
uniform vec4 uResolution;

//
// Description : Array and textureless GLSL 2D simplex noise function.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License : Distributed under the MIT License.
//               https://github.com/ashima/webgl-noise
//

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

float noise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec3 curl(float x, float y, float z) {
  float eps = 1.0;
  float eps2 = 2.0 * eps;
  float n1, n2, a, b;

  x += uTime * 0.05;
  y += uTime * 0.05;
  z += uTime * 0.05;

  vec3 curlVec = vec3(0.0);

  n1 = noise(vec2(x, y + eps));
  n2 = noise(vec2(x, y - eps));
  a = (n1 - n2) / eps2;

  n1 = noise(vec2(x, z + eps));
  n2 = noise(vec2(x, z - eps));
  b = (n1 - n2) / eps2;
  curlVec.x = a - b;

  n1 = noise(vec2(y, z + eps));
  n2 = noise(vec2(y, z - eps));
  a = (n1 - n2) / eps2;

  n1 = noise(vec2(x + eps, z));
  n2 = noise(vec2(x - eps, z));
  b = (n1 - n2) / eps2;
  curlVec.y = a - b;

  n1 = noise(vec2(x + eps, y));
  n2 = noise(vec2(x - eps, y));
  a = (n1 - n2) / eps2;

  n1 = noise(vec2(y + eps, z));
  n2 = noise(vec2(y - eps, z));
  b = (n1 - n2) / eps2;
  curlVec.z = a - b;

  return curlVec;
}

void main() {
  vec3 newPos = position;
  float f = 1.5;
  float amplitude = 1.35;
  float maxDistance = 3.0;

  vec3 target = position + curl(newPos.x * f, newPos.y * f, newPos.z * f) * amplitude;
  float d = length(newPos - target) / maxDistance;
  newPos = mix(position, target, pow(d, 4.0));

  vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
  // gl_PointSize = 0.1;

  // Calculate particle size
  float particleSize = 0.15; // Adjust this formula as needed
  // Adjust particle size based on screen resolution
  particleSize *= min(uResolution.a, uResolution.b)/min(16.,9.);
  // Set gl_PointSize
  gl_PointSize = particleSize;
  
  gl_Position = projectionMatrix * mvPosition;
}
