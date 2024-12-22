// main.js
// // Description: Main JavaScript file for the experiment.
// Jongsoo Ha and Lorenzo Orio (2024)


import { instructionSteps } from "./instructionSteps.js"; // import the instruction steps data

document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("popup");
  const startExperimentButton = document.getElementById("startExperiment");
  const instructionPopup = document.getElementById("instructionPopup");
  const experimentContainer = document.getElementById("experimentContainer");
  const instructionTitle = document.getElementById("instructionTitle");
  const instructionText = document.getElementById("instructionText");
  const nextStepButton = document.getElementById("nextStep");
  const stepDisplay = document.getElementById("stepDisplay");

// ---------------------------------------------------- Main Script ---------------------------------------------------- //

let currentStep = 0;
let isComplete = false;

  /**
   * Function: Show a specific instruction step.
   * @param {number} stepIndex - Index of the current instruction step.
   */
  function showInstructionStep(stepIndex) {
    const step = instructionSteps[stepIndex];
    instructionTitle.textContent = step.title;
    instructionText.textContent = step.text;
    instructionPopup.classList.remove("hidden");
    setTimeout(() => {
      instructionPopup.classList.remove("opacity-0");
    }, 10); // Trigger fade-in effect
  }

  /**
   * Updates the step display at the top of the screen.
   * @param {string} stepText - The text to display for the current step.
   */
  function updateStepDisplay(stepText) {
    stepDisplay.classList.remove("hidden");
    stepDisplay.textContent = stepText;
  }

  /**
   * Function: Hide the instruction pop-up.
   */
  function hideInstructionPopup() {
    instructionPopup.classList.add("opacity-0");
    setTimeout(() => {
      instructionPopup.classList.add("hidden");
    }, 500); // Ensure it matches the CSS transition duration
  }

  /**
   * Event Listener: Handle the "Start Experiment" button.
   */
  startExperimentButton.addEventListener("click", () => {
    popup.classList.add("hidden");
    experimentContainer.classList.remove("hidden");
    
    initializeExperiment();

    // Show the first instruction step after a slight delay
    setTimeout(() => {
      showInstructionStep(currentStep);
    }, 1000);
  });
  

// ---------------------------------------------------- End of Main Script ---------------------------------------------------- //


  /**
   * Event Listener: Handle the "OK" button for the next instruction step.
   */
  nextStepButton.addEventListener("click", () => {
    hideInstructionPopup(); // Hide the instruction pop-up
    if (isComplete) return; // Prevent further steps after completion
    const step = instructionSteps[currentStep];
    console.log(`Current Step: ${step.flag}`); // Log current step immediately
    updateStepDisplay(step.text);
    handleStepCompletion(step.flag); // Handle the completion of the current step

  });

  /**
   * Function: Complete the experiment and show the final message.
   */
  function completeExperiment() {
    isComplete = true;
    instructionTitle.textContent = "Experiment Complete!";
    instructionText.textContent = "You have successfully completed all steps of the experiment.";
    instructionPopup.classList.remove("hidden", "opacity-0");
    updateStepDisplay("Experiment Complete!");
    handleStepCompletion("complete");
    console.log("All steps completed!");
  }

  /**
   * Function: Trigger the next instruction step from the 3D environment.
   * @param {string} flag - The flag of the completed step.
   * @param {boolean} finalObjectClicked - Flag for the final step.
   */
  function triggerNextStep(flag, finalObjectClicked = false) {
    const nextStepIndex =
      instructionSteps.findIndex((step) => step.flag === flag) + 1;

    // Handle specific step4 logic
    if (flag === "step4") {
      if (!finalObjectClicked) {
-       updateStepDisplay("Close the petri plate with the lid facing down."); // Update display
        showInstructionStep(currentStep); // Show step4 instructions
      } else {
        completeExperiment(); // Complete the experiment if already clicked
      }
      return;
    }

    if (nextStepIndex < instructionSteps.length) {
      currentStep = nextStepIndex;
      showInstructionStep(currentStep); // Show the next instruction step


      // Update the step display with the new step's text
      const nextStep = instructionSteps[nextStepIndex];
      updateStepDisplay(nextStep.text); // Update the step display at the top

    }
  }


  /**
   * Function: Handle logic for completing a step in the 3D environment.
   * @param {string} flag - The flag of the completed step.
   */
  function handleStepCompletion(flag) {
    // Example: Send the flag to the 3D experiment or perform any necessary logic
    import("./3DExperiment.js")
      .then((module) => {
        module.onStepComplete(flag); // Notify the 3D logic and pass the callback
      })
      .catch((err) => {
        console.error("Error handling step completion:", err);
      });
  }

  /**
   * Function: Initialize the 3D experiment.
   */
  function initializeExperiment() {
    import("./3DExperiment.js")
      .then((module) => {
        module.startExperiment(triggerNextStep); // Pass the callback for triggering steps
      })
      .catch((err) => {
        console.error("Error initializing the 3D experiment:", err);
      });
  }
});