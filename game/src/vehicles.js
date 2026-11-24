// ARUNIKA: Golden Hour — vehicles.js
// Low-poly car, police car and helicopter factories. Every vehicle is built
// from boxes and cylinders so the game needs no art files at all.
import { THREE } from './three.js';

const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.5, 10);
const wheelMat = new THREE.MeshLambertMaterial({ color: 0x141414 });

export function makeCar(color, opts = {}) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.75, 4.6), bodyMat);
  body.position.y = 0.75; g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.65, 2.2),
    new THREE.MeshLambertMaterial({ color: 0x18202e }));
  cabin.position.set(0, 1.4, -0.3); g.add(cabin);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.18, 4.62),
    new THREE.MeshLambertMaterial({ color: opts.stripe || 0x111111 }));
  stripe.position.y = 0.95; g.add(stripe);
  const wheels = [];
  for (const [x, z] of [[-1.05, 1.5], [1.05, 1.5], [-1.05, -1.5], [1.05, -1.5]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2; w.position.set(x, 0.55, z); g.add(w); wheels.push(w);
  }
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
  for (const x of [-0.7, 0.7]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.1), lightMat);
    h.position.set(x, 0.85, -2.32); g.add(h);
  }
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
  for (const x of [-0.7, 0.7]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.22, 0.1), tailMat);
    t.position.set(x, 0.85, 2.32); g.add(t);
  }
  g.userData = { bodyMat, wheels, color, speed: 0, heading: 0, hp: 100, burning: false };
  return g;
}

export function makePoliceCar() {
  const g = makeCar(0xf2f2f2, { stripe: 0x1d3557 });
  const bar = new THREE.Group();
  const red = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.5),
    new THREE.MeshBasicMaterial({ color: 0xff2020 }));
  red.position.x = -0.45; bar.add(red);
  const blue = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.5),
    new THREE.MeshBasicMaterial({ color: 0x2050ff }));
  blue.position.x = 0.45; bar.add(blue);
  bar.position.y = 1.85; g.add(bar);
  g.userData.lightbar = { red, blue };
  g.userData.hp = 100;
  return g;
}

// Rajawali-1: police helicopter with a body, tail, spinning rotor and a
// visible searchlight cone. The body must read in the cover screenshot.
export function makeHelicopter() {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x1d3557 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 5.2), bodyMat);
  body.position.y = 0; g.add(body);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 1.6),
    new THREE.MeshLambertMaterial({ color: 0x9fd8ef }));
  glass.position.set(0, 0.3, -2.4); g.add(glass);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 5.5), bodyMat);
  tail.position.set(0, 0.4, 5); g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 1.2), bodyMat);
  fin.position.set(0, 1.2, 7.4); g.add(fin);
  const skidMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  for (const x of [-1.2, 1.2]) {
    const skid = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 4.4), skidMat);
    skid.position.set(x, -1.3, 0); g.add(skid);
  }
  const rotor = new THREE.Mesh(new THREE.BoxGeometry(13, 0.12, 0.7),
    new THREE.MeshLambertMaterial({ color: 0x111111 }));
  rotor.position.y = 1.35; g.add(rotor);
  const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.4, 0.7),
    new THREE.MeshLambertMaterial({ color: 0x111111 }));
  tailRotor.position.set(0.5, 1.2, 7.4); g.add(tailRotor);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff6c0 }));
  lamp.position.set(0, -1.1, -1.8); g.add(lamp);
  const coneGeo = new THREE.ConeGeometry(7, 30, 20, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xfff2b0, transparent: true, opacity: 0.22,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.rotation.x = Math.PI; cone.position.set(0, -16, -1.8); g.add(cone);
  const spot = new THREE.PointLight(0xfff2b0, 1.2, 60);
  spot.position.set(0, -3, -2); g.add(spot);
  g.userData = { rotor, tailRotor, cone };
  return g;
}

// A cheap explosion: orange flash light + dark smoke billboard, fades out.
export function makeExplosion(scene, x, y, z) {
  const g = new THREE.Group();
  const flash = new THREE.Mesh(new THREE.SphereGeometry(3.2, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xff8c1a, transparent: true, opacity: 0.95 }));
  g.add(flash);
  const smoke = new THREE.Mesh(new THREE.SphereGeometry(4.5, 8, 8),
    new THREE.MeshLambertMaterial({ color: 0x2a2a2a, transparent: true, opacity: 0.75 }));
  smoke.position.y = 4; g.add(smoke);
  const light = new THREE.PointLight(0xff7a1a, 3, 55);
  light.position.y = 2; g.add(light);
  g.position.set(x, y, z);
  scene.add(g);
  return { group: g, life: 1 };
}
