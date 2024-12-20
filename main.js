document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("popup");
  const startExperimentButton = document.getElementById("startExperiment");
  const instructionPopup = document.getElementById("instructionPopup");
  const experimentContainer = document.getElementById("experimentContainer");
  const instructionTitle = document.getElementById("instructionTitle");
  const instructionText = document.getElementById("instructionText");
  const nextStepButton = document.getElementById("nextStep");

  // Instruction steps data
  const instructionSteps = [
    {
      flag: "step1",
      title: "Safety First: Wear the Gloves",
      text: "Click on the gloves to wear them.",
    },
    {
      flag: "step2",
      title: "Step 2: Use the Swab",
      text: "Take the swab and gently collect a sample from the petri dish.",
    },
    {
      flag: "step3",
      title: "Step 3: Place the Swab in the Tube",
      text: "Finally, place the swab into the test tube to complete the experiment.",
    },
  ];

  let currentStep = 0;

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
    console.log(`Completed Step: ${step.flag}`); // Log the step flag for debugging
    handleStepCompletion(step.flag); // Pass the step flag to the 3D logic for triggering the next step
  });

  /**
   * Function: Trigger the next instruction step from the 3D environment.
   * @param {string} flag - The flag of the completed step.
   */
  function triggerNextStep(flag) {
    const nextStepIndex =
      instructionSteps.findIndex((step) => step.flag === flag) + 1;

    if (nextStepIndex < instructionSteps.length) {
      currentStep = nextStepIndex;
      showInstructionStep(currentStep); // Show the next instruction step
    } else {
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
        module.onStepComplete(flag, triggerNextStep); // Notify the 3D logic and pass the callback
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
