import * as THREE from "three";

/**
 * Function to create a lab environment with walls, floor, and ceiling.
 * @param {THREE.Scene} scene - The scene to add the lab environment to.
 */
export function createLabEnvironment(scene) {
  const textureLoader = new THREE.TextureLoader();

  // Load textures
  const wallTexture = textureLoader.load("./textures/lab_wall.jpg");
  const floorTexture = textureLoader.load("./textures/lab_floor.jpg");
  const ceilingTexture = textureLoader.load("./textures/lab_ceiling.jpg");

  // Materials
  const wallMaterial = new THREE.MeshStandardMaterial({
    map: wallTexture,
    side: THREE.DoubleSide, // So we can see the wall from inside
  });
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture,
    side: THREE.DoubleSide, // Helps avoid seeing through the floor from underneath
  });
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    map: ceilingTexture,
    side: THREE.DoubleSide, // Helps avoid seeing through the ceiling from above
  });

  // Dimensions
  const wallWidth = 8;
  const wallHeight = 4;

  // ------------------ BACK WALL ------------------
  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(wallWidth, wallHeight),
    wallMaterial
  );
  // Position at z = -wallWidth/2, rotate 180° so texture faces inward
  backWall.position.set(0, wallHeight / 2 - 0.5, -wallWidth / 2);
  backWall.rotation.y = Math.PI; // Flip to face inward
  scene.add(backWall);

  // ------------------ LEFT WALL ------------------
  const leftWall = new THREE.Mesh(
    new THREE.PlaneGeometry(wallWidth, wallHeight),
    wallMaterial
  );
  // Rotate 90° so plane extends along Z, place at x = -wallWidth/2
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-wallWidth / 2, wallHeight / 2 - 0.5, 0);
  scene.add(leftWall);

  // ------------------ RIGHT WALL ------------------
  const rightWall = new THREE.Mesh(
    new THREE.PlaneGeometry(wallWidth, wallHeight),
    wallMaterial
  );
  // Rotate -90°, place at x = +wallWidth/2
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(wallWidth / 2, wallHeight / 2 - 0.5, 0);
  scene.add(rightWall);

  // ------------------ FRONT WALL ------------------
  // Often omitted if you want an open view, but let's fully enclose the room
  const frontWall = new THREE.Mesh(
    new THREE.PlaneGeometry(wallWidth, wallHeight),
    wallMaterial
  );
  // Position at z = +wallWidth/2, rotate 180° to face inward
  frontWall.position.set(0, wallHeight / 2 - 0.5, wallWidth / 2);
  frontWall.rotation.y = Math.PI;
  scene.add(frontWall);

  // ------------------ FLOOR ------------------
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(wallWidth, wallWidth),
    floorMaterial
  );
  // Rotate to be horizontal, place slightly lower than y=0
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.51, 0);
  scene.add(floor);

  // ------------------ CEILING ------------------
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(wallWidth, wallWidth),
    ceilingMaterial
  );
  // Rotate to be horizontal. Also rotate Z by π to flip the texture orientation
  ceiling.rotation.x = Math.PI / 2;
  ceiling.rotation.z = Math.PI; // flips the texture so it won't appear reversed
  ceiling.position.set(0, wallHeight - 0.5, 0);
  scene.add(ceiling);
}
