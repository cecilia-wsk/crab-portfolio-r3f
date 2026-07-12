import gsap from "gsap";

const HOME_STATE = { pos: [-3, 0, 0], scale: [1, 1, 1] };
const ABOUT_STATE = { pos: [3.5, 0, 0], scale: [0.9, 0.9, 0.9] };

export async function animateCrabToAbout(crabGroup, baseRotation) {
  if (!crabGroup) return;
  crabGroup.userData.isTransitioning = true;

  await Promise.all([
    gsap.to(crabGroup.position, {
      x: ABOUT_STATE.pos[0],
      y: ABOUT_STATE.pos[1],
      z: ABOUT_STATE.pos[2],
      duration: 1.2,
      ease: "power2.inOut",
    }),
    gsap.to(crabGroup.scale, {
      x: ABOUT_STATE.scale[0],
      y: ABOUT_STATE.scale[1],
      z: ABOUT_STATE.scale[2],
      duration: 1.2,
      ease: "power2.inOut",
    }),
    gsap.to(crabGroup.rotation, {
      y: baseRotation + Math.PI * 0.8,
      duration: 1.2,
      ease: "power2.inOut",
      onStart: () => { crabGroup.userData.targetRotationY = baseRotation + Math.PI * 0.8; },
    }),
  ]);

  crabGroup.userData.isTransitioning = false;
}

export async function animateCrabToHome(crabGroup, baseRotation) {
  if (!crabGroup) return;
  crabGroup.userData.isTransitioning = true;

  await Promise.all([
    gsap.to(crabGroup.position, {
      x: HOME_STATE.pos[0],
      y: HOME_STATE.pos[1],
      z: HOME_STATE.pos[2],
      duration: 1.2,
      ease: "power2.inOut",
    }),
    gsap.to(crabGroup.scale, {
      x: HOME_STATE.scale[0],
      y: HOME_STATE.scale[1],
      z: HOME_STATE.scale[2],
      duration: 1.2,
      ease: "power2.inOut",
    }),
    gsap.to(crabGroup.rotation, {
      y: baseRotation,
      duration: 1.2,
      ease: "power2.inOut",
      onStart: () => { crabGroup.userData.targetRotationY = baseRotation; },
    }),
  ]);

  crabGroup.userData.isTransitioning = false;
}

export function setCrabAtAbout(crabGroup, baseRotation) {
  if (!crabGroup) return;
  crabGroup.position.set(...ABOUT_STATE.pos);
  crabGroup.scale.set(...ABOUT_STATE.scale);
  crabGroup.rotation.y = baseRotation + Math.PI * 0.8;
  crabGroup.userData.targetRotationY = baseRotation + Math.PI * 0.8;
}

export function setCrabAtHome(crabGroup, baseRotation) {
  if (!crabGroup) return;
  crabGroup.position.set(...HOME_STATE.pos);
  crabGroup.scale.set(...HOME_STATE.scale);
  crabGroup.rotation.y = baseRotation;
  crabGroup.userData.targetRotationY = baseRotation;
}
