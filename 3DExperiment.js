// Import necessary modules
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// === Scene, Camera, and Renderer Setup ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  65, // Field of view
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1, // Near clipping plane
  1000 // Far clipping plane
);
camera.position.set(0, 1.5, 1.5); // Adjusted camera position
camera.lookAt(0, 1, 0); // Ensure the camera points at the origin

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor("#bfbfbf"); // Background color
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = "absolute";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.width = "100%";
renderer.domElement.style.height = "100%";
document.body.appendChild(renderer.domElement);

// OrbitControls for camera interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Directional lighting for the scene
const light = new THREE.DirectionalLight(0xffffff, 4);
light.position.set(5, 10, 7.5);
scene.add(light);

// === Raycaster, Mouse, Hover, and Click ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const selectableObjects = []; // Objects that can be hovered or clicked
let previouslyHoveredObject = null; // Track the last hovered object

// Highlight on hover
window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(selectableObjects, true);

  if (intersects.length > 0) {
    const hoveredObject = intersects[0].object.parent; // Get the parent group of the object
    if (hoveredObject !== previouslyHoveredObject) {
      // Reset the highlight on the previously hovered object
      if (previouslyHoveredObject) {
        previouslyHoveredObject.traverse((child) => {
          if (child.isMesh) {
            child.material.emissive.setHex(
              child.userData.originalEmissiveHex || 0x000000
            ); // Reset emissive color
          }
        });
      }

      // Highlight the new object
      hoveredObject.traverse((child) => {
        if (child.isMesh) {
          if (!child.userData.originalEmissiveHex) {
            child.userData.originalEmissiveHex =
              child.material.emissive.getHex(); // Store original emissive color
          }
          child.material.emissive.setHex(0xff0000); // Set highlight color
        }
      });

      previouslyHoveredObject = hoveredObject; // Update the previously hovered object
    }
  } else if (previouslyHoveredObject) {
    // Reset the highlight when nothing is hovered
    previouslyHoveredObject.traverse((child) => {
      if (child.isMesh) {
        child.material.emissive.setHex(
          child.userData.originalEmissiveHex || 0x000000
        ); // Reset emissive color
      }
    });
    previouslyHoveredObject = null; // Clear the previously hovered object
  }
});

// === Add Click Feature to Trigger Next Step ===
export function startExperiment(triggerNextStep) {
  // Add event listener for clicks
  window.addEventListener("click", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(selectableObjects, true);
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object.parent; // Get the parent group of the clicked object

      console.log(`Clicked on: ${clickedObject.name || "Unnamed Object"}`);

      // Trigger the next step based on the clicked object's name
      switch (clickedObject.name) {
        case "Cube_0": // aka the gloves
          console.log("Glove clicked!");
          triggerNextStep("step1"); // Trigger the next step for Petri Dish
          break;
        default:
          console.log("Object not mapped to a step.");
      }
    }
  });
}

// Add a grid helper to the scene
const gridHelper = new THREE.GridHelper(40, 400); // Size of the grid and number of divisions
gridHelper.position.set(0, -0.5, 0); // Ensure it's centered at the origin
scene.add(gridHelper);

/**
 * Function: onStepComplete
 * Handles logic when a step is completed in the 3D environment.
 * @param {string} flag - The identifier of the completed step.
 * @param {function} triggerNextStep - Callback to trigger the next step.
 */
export function onStepComplete(flag, triggerNextStep) {
  console.log(`Step completed with flag: ${flag}`);

  // Perform 3D logic based on the completed step
  switch (flag) {
    case "step1":
      console.log("Step 1 logic executed.");
      // Example: Enable interaction with the next 3D object
      // enableNext3DObject("step2Object");
      break;
    case "step2":
      console.log("Step 2 logic executed.");
      // Example: Play an animation or update the scene
      // playAnimation("step2Animation");
      break;
    default:
      console.warn(`No specific logic defined for flag: ${flag}`);
  }

  // Trigger the next step using the callback
  triggerNextStep(flag);
}

// === Load Models Dynamically ===
const loader = new GLTFLoader();

// Load the lab bench
loader.load("./models/lab_bench.glb", (gltf) => {
  const table = gltf.scene;
  table.position.set(0, 0, 0); // Position the table at the origin
  table.name = "Lab Bench";
  scene.add(table);
});

// Load the petri dish
loader.load("./models/petridish_and_loop.glb", (gltf) => {
  const petriDish = gltf.scene;
  petriDish.position.set(0.95, 0.53, -0.15); // Adjust position if necessary
  petriDish.scale.set(0.8, 0.8, 0.8);
  petriDish.name = "Petri Dish";

  // Add meshes to selectable objects for interaction
  petriDish.traverse((child) => {
    if (child.isMesh) {
      child.material = child.material.clone(); // Clone material to avoid sharing
      selectableObjects.push(child);
    }
  });

  scene.add(petriDish);
});

// Load the flint striker
loader.load("./models/flint_striker.glb", (gltf) => {
  const flintStriker = gltf.scene;
  flintStriker.name = "Flint Striker";

  // Add meshes to selectable objects for interaction
  flintStriker.traverse((child) => {
    if (child.isMesh) {
      child.material = child.material.clone(); // Clone material to avoid sharing
      selectableObjects.push(child); // Make it selectable
    }
  });

  scene.add(flintStriker);
});

// Load the final result
loader.load("./models/final_result.glb", (gltf) => {
  const finalResult = gltf.scene;
  finalResult.name = "Final Result"; // Assign a name for identification

  // Traverse and add its meshes to selectable objects for interaction
  finalResult.traverse((child) => {
    if (child.isMesh) {
      child.material = child.material.clone(); // Clone material to avoid sharing
      selectableObjects.push(child); // Make it selectable
    }
  });

  scene.add(finalResult); // Add the model to the scene
});

// Load gloves
loader.load("./models/glove.glb", (gltf) => {
  const glove1 = gltf.scene;
  const glove2 = gltf.scene.clone(); // Clone to create another glove

  glove1.position.set(-1.1, 0.57, 0.2);
  glove2.position.set(-0.9, 0.57, 0.2);
  glove1.scale.set(0.08, 0.08, 0.08);
  glove2.scale.set(0.08, 0.08, 0.08);
  glove1.rotation.y = -Math.PI / 3;
  glove2.rotation.y = -Math.PI / 2;
  glove1.name = "Glove 1";
  glove2.name = "Glove 2";

  // Add both gloves to selectable objects
  [glove1, glove2].forEach((glove) => {
    glove.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        selectableObjects.push(child);
      }
    });
    scene.add(glove);
  });
});

// === Handle Window Resize ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === Animation Loop ===
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
