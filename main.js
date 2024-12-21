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

  // Instruction steps data
  // I have moved this data to a separate file for better organization

  let currentStep = 0;
  let flintStrikerClicked = false; // Flag for the flint striker step

  /**
   * Function: Show a specific instruction step.
   * @param {number} stepIndex - Index of the current instruction step.
   */
  function showInstructionStep(stepIndex) {
    const step = instructionSteps[stepIndex];
    instructionTitle.textContent = step.title;
    instructionText.textContent = step.text;
    instructionPopup.classList.remove("hidden", "opacity-0");
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

  /**
   * Event Listener: Handle the "OK" button for the current instruction step.
   */
  nextStepButton.addEventListener("click", () => {
    hideInstructionPopup(); // Hide the instruction pop-up
    
    const step = instructionSteps[currentStep];
    console.log(`Current Step: ${step.flag}`); // Log current step immediately

    // Special handling for step3
    if (step.flag === "step3" && !flintStrikerClicked) {
      updateStepDisplay(step.text);
      handleStepCompletion(step.flag); // Still handle the step completion
      return;
    }

    // If we're in a completed state, keep showing the completion message
    if (currentStep >= instructionSteps.length - 1) {
      updateStepDisplay("Experiment Complete!");
    } else {
      updateStepDisplay(step.text);
    }
    handleStepCompletion(step.flag); // Handle the completion of the current step
});

  /**
   * Function: Trigger the next instruction step from the 3D environment.
   * @param {string} flag - The flag of the completed step.
   */
  function triggerNextStep(flag) {
    const nextStepIndex =
      instructionSteps.findIndex((step) => step.flag === flag) + 1;

      // Set the flintStrikerClicked flag when step3 is completed
    if (flag === "step3") {
      flintStrikerClicked = true;
    }

    if (nextStepIndex < instructionSteps.length) {
      currentStep = nextStepIndex;
      showInstructionStep(currentStep); // Show the next instruction step


      // Update the step display with the new step's text
      const nextStep = instructionSteps[nextStepIndex];
      updateStepDisplay(nextStep.text); // Update the step display at the top

    } else {
      // Show completion message in instruction popup
      instructionTitle.textContent = "Experiment Complete!";
      instructionText.textContent = "You have successfully completed all steps of the experiment.";
      instructionPopup.classList.remove("hidden", "opacity-0");
      updateStepDisplay("Experiment Complete!");

      handleStepCompletion("complete");
      console.log("All steps completed!");
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
