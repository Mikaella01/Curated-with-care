
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const hero = document.querySelector(".hero-world");

if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  // No 3D scene when the hero is missing or reduced motion is preferred.
} else {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    35,
    hero.clientWidth / hero.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 10);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(hero.clientWidth, hero.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  renderer.domElement.className = "hero-three-canvas";
  Object.assign(renderer.domElement.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "2"
  });

  hero.prepend(renderer.domElement);

  // LIGHTING
  scene.add(new THREE.HemisphereLight(0xfff4e8, 0xb69a8d, 2.2));

  const keyLight = new THREE.DirectionalLight(0xfff4df, 3.2);
  keyLight.position.set(-4, 6, 7);
  scene.add(keyLight);

  const blushLight = new THREE.PointLight(0xe8b9ad, 24, 18);
  blushLight.position.set(4, 1, 4);
  scene.add(blushLight);

  const rimLight = new THREE.PointLight(0xffe2b9, 16, 15);
  rimLight.position.set(-3, -2, 3);
  scene.add(rimLight);

  // MATERIALS
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xfff8ef,
    metalness: 0,
    roughness: 0.1,
    transmission: 0.9,
    thickness: 1.1,
    ior: 1.45,
    transparent: true,
    opacity: 0.95
  });

  const blushLiquid = new THREE.MeshPhysicalMaterial({
    color: 0xd9aaa0,
    roughness: 0.22,
    metalness: 0,
    transmission: 0.18,
    thickness: 0.5
  });

  const champagne = new THREE.MeshStandardMaterial({
    color: 0xc8a878,
    metalness: 0.82,
    roughness: 0.23
  });

  const labelMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5e9dc,
    roughness: 0.65
  });

  // ROUNDED BOTTLE SHAPE
  function createBottle(scale = 1) {
    const group = new THREE.Group();

    const bodyGeometry = new THREE.CylinderGeometry(
      0.58, 0.62, 2.05, 64, 1
    );

    const body = new THREE.Mesh(bodyGeometry, glass);
    body.position.y = -0.12;
    group.add(body);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.57, 0.6, 0.12, 64),
      glass
    );
    base.position.y = -1.18;
    group.add(base);

    const liquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.49, 0.53, 1.05, 64),
      blushLiquid
    );
    liquid.position.y = -0.62;
    group.add(liquid);

    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.23, 0.28, 0.28, 48),
      glass
    );
    neck.position.y = 1.05;
    group.add(neck);

    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.12, 48),
      champagne
    );
    collar.position.y = 1.23;
    group.add(collar);

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.27, 0.58, 48),
      champagne
    );
    cap.position.y = 1.57;
    group.add(cap);

    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.72, 0.48),
      labelMaterial
    );
    label.position.set(0, -0.05, 0.59);
    group.add(label);

    const labelLine = new THREE.Mesh(
      new THREE.PlaneGeometry(0.35, 0.012),
      champagne
    );
    labelLine.position.set(0, -0.04, 0.601);
    group.add(labelLine);

    group.scale.setScalar(scale);
    return group;
  }

  const mainBottle = createBottle(1);
  mainBottle.position.set(1.8, -0.1, 0);
  mainBottle.rotation.z = -0.08;
  scene.add(mainBottle);

  const secondBottle = createBottle(0.58);
  secondBottle.position.set(3.45, -0.75, -0.9);
  secondBottle.rotation.z = 0.1;
  scene.add(secondBottle);

  // GLASS SPHERES
  const sphereMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xfff4eb,
    metalness: 0,
    roughness: 0.04,
    transmission: 0.96,
    thickness: 1.4,
    transparent: true,
    opacity: 0.9
  });

  const sphereData = [
    { x: 0.55, y: 1.5, z: 0.2, size: 0.34 },
    { x: 3.05, y: 1.4, z: 0.4, size: 0.22 },
    { x: 4.1, y: -1.25, z: 0.2, size: 0.4 },
    { x: 0.25, y: -1.6, z: -0.5, size: 0.17 }
  ];

  const spheres = [];

  sphereData.forEach((item, index) => {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(item.size, 48, 48),
      sphereMaterial
    );

    sphere.position.set(item.x, item.y, item.z);
    scene.add(sphere);

    spheres.push({
      mesh: sphere,
      startY: item.y,
      phase: index * 1.3
    });
  });

  // FLOATING PETALS
  const petalMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe8c6bd,
    roughness: 0.36,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.78
  });

  const petals = [];

  function addPetal() {
    const shape = new THREE.Shape();

    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.3, 0.28, 0.48, 0.68, 0, 1);
    shape.bezierCurveTo(-0.48, 0.68, -0.3, 0.28, 0, 0);

    const petal = new THREE.Mesh(
      new THREE.ShapeGeometry(shape, 24),
      petalMaterial
    );

    petal.position.set(
      THREE.MathUtils.randFloat(-1.2, 4.5),
      THREE.MathUtils.randFloat(-2, 2),
      THREE.MathUtils.randFloat(-1, 0.5)
    );

    petal.scale.setScalar(THREE.MathUtils.randFloat(0.12, 0.22));
    scene.add(petal);

    petals.push({
      mesh: petal,
      speed: THREE.MathUtils.randFloat(0.12, 0.3),
      rotation: THREE.MathUtils.randFloat(-0.35, 0.35)
    });
  }

  for (let i = 0; i < 8; i++) {
    addPetal();
  }

  // ANIMATION
  const clock = new THREE.Clock();

  function animate() {
    const time = clock.getElapsedTime();

    mainBottle.position.y = -0.1 + Math.sin(time * 0.65) * 0.07;
    mainBottle.rotation.y = Math.sin(time * 0.3) * 0.06;

    secondBottle.position.y =
      -0.75 + Math.sin(time * 0.55 + 1) * 0.06;

    spheres.forEach((item) => {
      item.mesh.position.y =
        item.startY + Math.sin(time * 0.6 + item.phase) * 0.1;
    });

    petals.forEach((item) => {
      item.mesh.position.y -= item.speed * 0.008;
      item.mesh.rotation.z += item.rotation * 0.003;

      if (item.mesh.position.y < -2.5) {
        item.mesh.position.y = 2.5;
        item.mesh.position.x = THREE.MathUtils.randFloat(-1.2, 4.5);
      }
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();

  // RESPONSIVE RESIZING
  const resizeObserver = new ResizeObserver(() => {
    const width = hero.clientWidth;
    const height = hero.clientHeight;

    if (!width || !height) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });

  resizeObserver.observe(hero);
}
