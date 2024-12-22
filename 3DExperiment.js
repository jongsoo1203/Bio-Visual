// 3DExperiment.js
// Description: This file contains the 3D experiment logic for the virtual lab.
// Jongsoo Ha and Lorenzo Orio (2024)

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createLabEnvironment } from "./LabEnvironment.js";

// -----------------------------------------------set up the 3D environment-----------------------------------------------
// === Scene, Camera, and Renderer Setup ===
const scene = new THREE.Scene();
createLabEnvironment(scene); 
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
controls.minDistance = 0.5;  // don’t let the camera get too close
controls.maxDistance = 3;    // don’t let the camera go too far

// === Lighting Setup ===
const ambientLight = new THREE.AmbientLight(0xe6e6e6, 1.2);
scene.add(ambientLight);

const directionalLight1 = new THREE.DirectionalLight(0xe6e6e6, 1.2);
directionalLight1.position.set(0, 10, 10);
scene.add(directionalLight1);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
directionalLight2.position.set(0, 10, 0);
scene.add(directionalLight2);

// === Raycaster, Mouse, Hover, and Click ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const selectableObjects = []; // Objects that can be hovered or clicked
let previouslyHoveredObject = null; // Track the last hovered object

// === Draggable Logic ===
let draggable = null;
let isDragging = false;
const moveMouse = new THREE.Vector2();
// Store the offset between mouse and object when starting drag
let dragOffset = new THREE.Vector3();
let dragStartPosition = new THREE.Vector3();


// ------------------------------------------ Flint striker plane ------------------------------------------
// Add a grid helper and ground plane to the scene
const gridHelperflint = new THREE.GridHelper(30, 30); // Size of the grid and number of divisions
gridHelperflint.position.set(0, -0.5, 0); // Ensure it's centered at the origin
scene.add(gridHelperflint);

// Create an invisible ground plane for drag interaction
const groundGeometry = new THREE.PlaneGeometry(2, 2);
const groundMaterial = new THREE.MeshBasicMaterial({ 
    visible: false 
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
ground.position.y = 0.1; // Set at table height
ground.userData.ground = true; // Mark as ground for raycaster
scene.add(ground);

// ------------------------------------------ End of flint striker plane ------------------------------------------



// ------------------------------------------------ Collision Box for Burner ---------------------------------------

// Create bounding boxes for collision detection
const burnerBoundingBox = new THREE.Box3();
const flintStrikerBoundingBox = new THREE.Box3();
let triggerNextStepCallback = null;


function checkCollision() {
  // Update bounding boxes with current positions
  burnerBoundingBox.setFromObject(burner);
  flintStrikerBoundingBox.setFromObject(flintStriker);
  
  return burnerBoundingBox.intersectsBox(flintStrikerBoundingBox);
}

// ------------------------------------------------ End of Collision Box for Burner ---------------------------------------

// === Mouse Events for Drag===
window.addEventListener("click", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  if (draggable) {
    const intersects = raycaster.intersectObjects(moveMouse, true);
    if (intersects.length > 0) {
      const ground = intersects.find((obj) => obj.object.userData.ground);
      if (ground) {
        const target = ground.point;
        draggable.position.x = target.x;
        draggable.position.z = target.z;
      }
    }
  }
});

// === Mouse Events for Drag===
window.addEventListener("mousedown", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Check if we clicked on the draggable object
  const intersects = raycaster.intersectObjects(selectableObjects, true);
  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    const parentObject = clickedObject.parent;

    // Check if the clicked object or its parent is the flint striker and is draggable
    if ((clickedObject.userData.isFlintStriker || 
         (parentObject && parentObject.name === "Flint Striker")) && 
         currentStep === "step2") {
      
      isDragging = true;
      draggable = flintStriker; // Set the entire flint striker model as draggable
      controls.enabled = false; // Disable orbit controls while dragging

      // Calculate the drag offset
      const groundIntersects = raycaster.intersectObject(ground);
      if (groundIntersects.length > 0) {
        const intersectionPoint = groundIntersects[0].point;
        dragOffset.copy(flintStriker.position).sub(intersectionPoint);
      }
    }
  }
});

// Update the draggable object's position while dragging
window.addEventListener("mousemove", (event) => {
  if (!isDragging || !draggable) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Intersect with the ground plane
  const intersects = raycaster.intersectObjects([ground], false);
  if (intersects.length > 0) {
    const intersectionPoint = intersects[0].point;
    
    // Update position while maintaining the y-position
    draggable.position.set(
      intersectionPoint.x + dragOffset.x,
      0.1, // Keep constant height
      intersectionPoint.z + dragOffset.z
    );

    // Check for collision with burner if in step2
    if (currentStep === "step2") {
      if (checkCollision()) {
        console.log("Collision detected with Bunsen burner!");
        
        // Reset the flint striker's emissive color
        flintStriker.traverse((child) => {
          if (child.isMesh) {
            child.material.emissive.setHex(child.userData.originalEmissiveHex || 0x000000);
          }
        });

        // Disable dragging
        flintStriker.traverse((child) => {
          if (child.isMesh) {
            child.userData.draggable = false;
          }
        });
        
        isDragging = false;
        draggable = null;
        controls.enabled = true;

        // Trigger the next step immediately
        if (triggerNextStepCallback) {
          triggerNextStepCallback("step2");
          currentStep = "step3";
        } else {
          console.warn("triggerNextStepCallback is not defined");
        }
      }
    }
  }
});

// Stop dragging when mouse is released
window.addEventListener("mouseup", () => {
  if (isDragging) {
    isDragging = false;
    controls.enabled = true; // Re-enable orbit controls
  }
});

// === Highlight on Hover ===
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

// -----------------------------------------------End of env set up----------------------------------------------

// === After Clicking Each Step Object ===
// they are used to store the 3D models
let glove1, glove2, finalResult, petriDish, flintStriker, toothpick, burner;
let currentStep = "step1"; // Track the current step of the experiment

// === Add Click Feature to Trigger Next Step ===
export function startExperiment(triggerNextStep) {
  triggerNextStepCallback = triggerNextStep;
  
  // Add event listener for clicks
  window.addEventListener("click", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(selectableObjects, true);
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object.parent; // Get the parent group of the clicked object
      const parentObject = clickedObject.parent; // Get the parent group of the clicked object

      console.log(`Clicked on: ${clickedObject.name || "Unnamed Object"}`);

      // Trigger the next step based on the clicked object's name
      switch (true) {
        case clickedObject.name === "Cube_0": // aka the gloves
          console.log("Glove clicked!");
          wearGloves(); // Animate the gloves to the camera's view

          // logic to trigger the next step and save the current step ( just copy and paste this logic for the other cases and switch the numbers)
          if (currentStep === "step1") {
            triggerNextStep("step1");
            currentStep = "step2";
          }
          break;
        case parentObject.name === "Flint Striker" || clickedObject.userData.isFlintStriker: // Add a condition for step3
          console.log("Flint Striker clicked!");

          if (currentStep === "step2") {
            // Enable dragging
            draggable = flintStriker; // Set as current draggable object
            flintStriker.traverse((child) => {
              if (child.isMesh) {
                child.userData.draggable = true;
                console.log("Enabled dragging for flint striker mesh:", child.name);
              }
            });
            
            // Optionally add visual feedback that the object is now draggable
            flintStriker.traverse((child) => {
              if (child.isMesh) {
                child.material.emissive.setHex(0x00ff00); // Green glow to indicate draggable
              }
            });

            console.log("Flint Striker is now draggable. Drag it to proceed.");
          }
          // I need to uncommen this when I add collision with another object
          // if (currentStep === "step2") {
          //   triggerNextStep("step2");
          //   currentStep = "step3";
          // }
          break;
        case parentObject.name === "Toothpick":
          console.log("Toothpick clicked!");

          if (currentStep === "step3") {
            triggerNextStep("step3");
            currentStep = "step4";
          }
          break;
        case clickedObject.name === "Circle001": // This is the toothpick
          console.log("Petri Dish clicked!");
          
          if (currentStep === "step4") {
            triggerNextStep("step4");
            currentStep = "complete";
          }
          break;
        default:
          console.log("Object not mapped to a step.");
      }
    }
  });
}

// === Wear Gloves Function ===
function wearGloves() {
  if (!glove1 || !glove2) {
    console.log("Gloves are not loaded yet.");
    return;
  }

  console.log("Wearing gloves...");

  // Ensure gloves are visible
  glove1.visible = true;
  glove2.visible = true;

  // Attach gloves to follow the camera
  const targetPosition1 = new THREE.Vector3(-0.3, -0.3, -0.5); // Left hand position relative to the camera
  const targetPosition2 = new THREE.Vector3(0.3, -0.3, -0.5); // Right hand position relative to the camera

  // Define rotation offsets as quaternions for the gloves
  const leftGloveRotationOffset = new THREE.Quaternion();
  // Set the left glove's rotation offset using Euler angles (pitch, yaw, roll)
  leftGloveRotationOffset.setFromEuler(new THREE.Euler(Math.PI, 0, Math.PI/11));

  const rightGloveRotationOffset = new THREE.Quaternion();
  // Set the right glove's rotation offset using Euler angles (pitch, yaw, roll)
  rightGloveRotationOffset.setFromEuler(
    new THREE.Euler(Math.PI / 8, Math.PI / 3, Math.PI /11)
  );

  function updateGloves() {
    // Update the gloves' positions relative to the camera
    glove1.position.copy(camera.localToWorld(targetPosition1.clone()));
    glove2.position.copy(camera.localToWorld(targetPosition2.clone()));

    // Update the gloves' rotations relative to the camera
    const cameraQuaternion = camera.quaternion.clone();

    const leftGloveQuaternion = cameraQuaternion.multiply(leftGloveRotationOffset);
    const rightGloveQuaternion = cameraQuaternion.multiply(rightGloveRotationOffset);

    glove1.quaternion.copy(leftGloveQuaternion);
    glove2.quaternion.copy(rightGloveQuaternion);
  }

  // Add updateGloves to the animation loop
  const originalAnimate = animate;
  animate = function () {
    updateGloves();
    originalAnimate();
  };

  console.log("Gloves are now following the camera's view with proper rotation.");
}

// Add a grid helper to the scene
const gridHelper = new THREE.GridHelper(40, 300); // Size of the grid and number of divisions
gridHelper.position.set(0, -0.5, 0); // Ensure it's centered at the origin
scene.add(gridHelper);

/**
 * Function: onStepComplete
 * Handles logic when a step is completed in the 3D environment.
 * @param {string} flag - The identifier of the completed step.
 */
export function onStepComplete(flag) {
  // Perform 3D logic based on the completed step
  switch (flag) {
    case "step1":
      console.log("Step 1 Instruction: Click Gloves.");
      break;
    case "step2":
      console.log("Step 2 Instruction: click Flint Striker.");
      break;
    case "step3":
      console.log("Step 3 Instruction: Click toothpick.");
      break;
    case "step4":
      console.log("Step 4 Instruction: click Petri Dish.");
      break;
    case "complete":
      if (finalResult) {
        finalResult.visible = true;
      }
      break;
    default:
      console.warn(`No specific logic defined for flag: ${flag}`);
  }
}

// ---------------------------------------------- Load 3D Models ----------------------------------------------

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
  petriDish = gltf.scene;
  petriDish.position.set(0.95, 0.53, -0.15); // Adjust position if necessary
  petriDish.scale.set(0.8, 0.8, 0.8);
  petriDish.name = "Petri Dish";

  // Traverse and ensure child objects also have proper names
  petriDish.traverse((child) => {
    if (child.isMesh) {
      child.name = "PetriDishMesh"; // Name individual meshes for debugging
      child.material = child.material.clone(); // Clone material to avoid sharing
      selectableObjects.push(child); // Make it selectable
    }
  });

  scene.add(petriDish);
});

// Load the flint striker
loader.load("./models/flint_striker.glb", (gltf) => {
  flintStriker = gltf.scene;
  flintStriker.name = "Flint Striker";
  flintStriker.position.set(0, 0.1, 0.15);
  flintStriker.scale.set(0.8, 0.8, 0.8);

  // Add meshes to selectable objects for interaction
  flintStriker.traverse((child) => {
    if (child.isMesh) {
      child.material = child.material.clone(); // Clone material to avoid sharing
      child.userData.isFlintStriker = true; // Mark as flint striker for identification
      child.userData.draggable = false; // Mark as draggable
      selectableObjects.push(child); // Make it selectable
    }
  });

  scene.add(flintStriker);
});

// Load the toothpick
loader.load("./models/toothpick.glb", (gltf) => {
  toothpick = gltf.scene;
  toothpick.name = "Toothpick"; // Assign a name for identification

  // Traverse and ensure child objects also have proper names
  toothpick.traverse((child) => {
    if (child.isMesh) {
      child.name = "ToothpickMesh"; // Name individual meshes for debugging
      child.material = child.material.clone(); // Clone material to avoid sharing
      selectableObjects.push(child); // Make it selectable
    }
  });

  scene.add(toothpick); // Add the model to the scene
});

// Load the burner
loader.load("./models/bunsen_burner.glb", (gltf) => {
  burner = gltf.scene;
  burner.name = "Toothpick"; // Assign a name for identification

  burner.position.set(-0.38, 0.53, 0); // x, y, z
  burner.scale.set(1.3,1.3,1.3); // Scale the burner
  burner.rotation.y = Math.PI / 3; // Rotate the burner

  // Traverse and ensure child objects also have proper names
  burner.traverse((child) => {
    if (child.isMesh) {
      child.name = "ToothpickMesh"; // Name individual meshes for debugging
      child.material = child.material.clone(); // Clone material to avoid sharing
      selectableObjects.push(child); // Make it selectable
    }
  });

  scene.add(burner); // Add the model to the scene
});

// Load the final result
loader.load("./models/final_result.glb", (gltf) => {
  finalResult = gltf.scene;
  finalResult.name = "Final Result"; // Assign a name for identification
  finalResult.visible = false; // Hide it initially

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
  glove1 = gltf.scene;
  glove2 = gltf.scene.clone(); // Clone to create another glove

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

// 1) Create a bounding box to keep the camera inside the "room"
const labBoundingBox = new THREE.Box3(
  new THREE.Vector3(-4.4, -0.4, -4.4), // a bit “tighter” in x/z
  new THREE.Vector3(4.4, 4.4, 4.4)
);
// Adjust the numbers so the camera remains comfortably within your walls
// ------------------------------------------------------------------------------------

// === Animation Loop ===
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // 2) Clamp the camera position so it doesn't leave the box
  camera.position.clamp(labBoundingBox.min, labBoundingBox.max);

  renderer.render(scene, camera);
}
animate()