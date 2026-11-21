
/* =========================================
   CURATED WITH CARE BY M.
   THE PERSONAL EDIT — QUESTIONNAIRE
========================================= */


document.addEventListener("DOMContentLoaded", function () {


  /* 1. GET PAGE ELEMENTS */

  const introScreen = document.getElementById("introScreen");
  const questionsScreen = document.getElementById("questionsScreen");

  const startButton = document.getElementById("startQuestionnaire");
  const backButton = document.getElementById("backButton");
  const nextButton = document.getElementById("nextButton");
  const finishButton = document.getElementById("finishButton");

  const form = document.getElementById("skincareQuestionnaire");

  const steps = Array.from(
    document.querySelectorAll(".question-step")
  );

  const stepLabel = document.getElementById("stepLabel");
  const progressFill = document.getElementById("progressFill");
  const formMessage = document.getElementById("formMessage");


  /* 2. QUESTIONNAIRE SETTINGS */

  const totalSteps = steps.length;

  let currentStep = 0;


  /* 3. START QUESTIONNAIRE */

  startButton.addEventListener("click", function () {

    introScreen.hidden = true;
    questionsScreen.hidden = false;

    currentStep = 0;

    showStep();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  });


  /* 4. DISPLAY CURRENT QUESTION */

  function showStep() {

    steps.forEach(function (step, index) {

      step.hidden = index !== currentStep;

    });


    /* Update progress label */

    stepLabel.textContent =
      "STEP " + (currentStep + 1) + " OF " + totalSteps;


    /* Update progress bar */

    const progress =
      ((currentStep + 1) / totalSteps) * 100;

    progressFill.style.width = progress + "%";


    /* Back button */

    backButton.hidden = currentStep === 0;


    /* Continue and finish buttons */

    const isLastStep = currentStep === totalSteps - 1;

    nextButton.hidden = isLastStep;
    finishButton.hidden = !isLastStep;


    /* Clear previous messages */

    formMessage.textContent = "";

  }


  /* 5. VALIDATE CURRENT QUESTION */

  function validateCurrentStep() {

    const currentFieldset = steps[currentStep];

    const requiredInputs = currentFieldset.querySelectorAll(
      "input[required]"
    );

    for (const input of requiredInputs) {

      if (!input.checkValidity()) {

        input.reportValidity();

        return false;

      }

    }

    return true;

  }


  /* 6. CONTINUE BUTTON */

  nextButton.addEventListener("click", function () {

    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < totalSteps - 1) {

      currentStep++;

      showStep();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    }

  });


  /* 7. BACK BUTTON */

  backButton.addEventListener("click", function () {

    if (currentStep > 0) {

      currentStep--;

      showStep();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    }

  });


  /* 8. COLLECT CUSTOMER ANSWERS */

  function collectAnswers() {

    const data = new FormData(form);

    const answers = {

      skinType:
        data.get("skinType") || "",

      concerns:
        data.getAll("concerns"),

      skinBehaviour:
        data.get("skinBehaviour") || "",

      sensitivity:
        data.get("sensitivity") || "",

      routine:
        data.get("routine") || "",

      productTypes:
        data.getAll("productTypes"),

      budget:
        data.get("budget") || "",

      goal:
        data.get("goal") || "",

      ingredientAvoidance:
        data.get("ingredientAvoidance") || "",

      fragrancePreference:
        data.get("fragrancePreference") || "No preference",

      personalNote:
        data.get("personalNote") || ""

    };

    return answers;

  }


  /* 9. SAVE CUSTOMER ANSWERS */

  function saveAnswers(answers) {

    try {

      localStorage.setItem(
        "curatedQuestionnaireAnswers",
        JSON.stringify(answers)
      );

      return true;

    } catch (error) {

      console.error(
        "Unable to save questionnaire answers:",
        error
      );

      return false;

    }

  }


  /* 10. FINISH QUESTIONNAIRE */

  form.addEventListener("submit", function (event) {

    event.preventDefault();

    if (!validateCurrentStep()) {
      return;
    }

    const answers = collectAnswers();

    const saved = saveAnswers(answers);

    if (!saved) {

      formMessage.textContent =
        "We couldn't save your answers. Please check your browser settings and try again.";

      return;

    }


    /* Confirmation */

    formMessage.textContent =
      "Your answers have been saved. Your Personal Edit is ready for the next step.";

    finishButton.textContent = "ANSWERS SAVED";

    finishButton.disabled = true;

    finishButton.style.opacity = "0.65";

    console.log(
      "Personal Edit questionnaire answers:",
      answers
    );

  });


  /* 11. INITIALISE QUESTIONNAIRE */

  steps.forEach(function (step, index) {

    step.hidden = index !== 0;

  });

  questionsScreen.hidden = true;

  introScreen.hidden = false;

  progressFill.style.width = "11.11%";

});
