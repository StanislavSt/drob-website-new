import { presetNames } from "./presets.js";

document.addEventListener("DOMContentLoaded", () => {
  let isPartyMode = false;

  // Audio and Visualizer Setup
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const audioElement = document.createElement("audio");

  // Audio

  // Audio Progress Range
  const audioProgress = document.getElementById("audio-progress");

  // Update the range as the audio plays
  audioElement.addEventListener("timeupdate", () => {
    const progress = (audioElement.currentTime / audioElement.duration) * 100;
    audioProgress.value = isNaN(progress) ? 0 : progress; // Avoid NaN for uninitialized audio
  });

  // Allow seeking when interacting with the range
  audioProgress.addEventListener("input", () => {
    const seekTime = (audioProgress.value / 100) * audioElement.duration;
    audioElement.currentTime = seekTime;
  });

  // Volume Control and Mute/Unmute
  const volumeRange = document.getElementById("default-range");
  const audioIcon = volumeRange.previousElementSibling.querySelector("svg");

  audioElement.volume = volumeRange.value / 100; // Set initial volume

  // Adjust volume as slider is moved
  volumeRange.addEventListener("input", () => {
    audioElement.volume = volumeRange.value / 100;
    if (audioElement.volume === 0) {
      audioElement.muted = true;
      updateAudioIcon(true);
    } else {
      audioElement.muted = false;
      updateAudioIcon(false);
    }
  });

  // Mute/unmute on icon click
  audioIcon.addEventListener("click", () => {
    audioElement.muted = !audioElement.muted;
    if (audioElement.muted) {
      volumeRange.value = 0; // Reflect muted state on slider
    } else {
      volumeRange.value = audioElement.volume * 100; // Reflect volume state on slider
    }
    updateAudioIcon(audioElement.muted);
  });

  // Function to update audio icon based on mute state
  function updateAudioIcon(isMuted) {
    if (isMuted) {
      audioIcon.innerHTML = `
      <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 32 32" height="30px" width="30px" xmlns="http://www.w3.org/2000/svg">
        <path d="M 17 3.59375 L 15.28125 5.28125 L 9.5625 11 L 5 11 L 5 21 L 9.5625 21 L 15.28125 26.71875 L 17 28.40625 Z M 23.71875 9.78125 L 22.28125 11.21875 L 20.21875 13.28125 L 18.15625 15.34375 L 16.09375 17.40625 L 14.03125 19.46875 L 12.59375 21.28125 L 14.03125 22.71875 L 23.71875 13.03125 L 25.15625 11.59375 Z"></path>
      </svg>
    `; // Muted icon
    } else {
      audioIcon.innerHTML = `
      <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 32 32" height="30px" width="30px" xmlns="http://www.w3.org/2000/svg">
        <path d="M 17 3.59375 L 15.28125 5.28125 L 9.5625 11 L 5 11 L 5 21 L 9.5625 21 L 15.28125 26.71875 L 17 28.40625 Z M 23.8125 8.1875 L 22.40625 9.59375 C 25.925781 13.113281 25.925781 18.761719 22.40625 22.28125 L 23.8125 23.71875 C 28.09375 19.4375 28.09375 12.46875 23.8125 8.1875 Z M 15 8.4375 L 15 23.5625 L 10.71875 19.28125 L 10.40625 19 L 7 19 L 7 13 L 10.40625 13 L 10.71875 12.71875 Z M 20.90625 11.09375 L 19.5 12.5 C 21.410156 14.410156 21.402344 17.574219 19.46875 19.59375 L 20.9375 21 C 23.601563 18.21875 23.59375 13.78125 20.90625 11.09375 Z"></path>
      </svg>
    `; // Unmuted icon
    }
  }

  audioElement.src = "assets/my_audio.mp3"; // Ensure this path is correct
  audioElement.controls = true;
  audioElement.className = "hidden";
  document.body.appendChild(audioElement);

  const audioSource = audioContext.createMediaElementSource(audioElement);

  const visualizerCanvas = document.getElementById("visualizer");
  const visualizer = butterchurn.default.createVisualizer(
    audioContext,
    visualizerCanvas,
    {
      width: window.outerWidth,
      height: window.outerHeight,
    }
  );

  if (visualizer.connectAudio) {
    visualizer.connectAudio(audioSource);
  } else {
    console.error("Visualizer does not have connectAudio method.");
  }

  audioSource.connect(audioContext.destination);

  // Fetch presets from the library
  const presets = butterchurnPresets.getPresets();

  // Randomly select a preset
  function getRandomPreset() {
    const randomIndex = Math.floor(Math.random() * presetNames.length);
    return presets[presetNames[randomIndex]];
  }

  // Function to load a random preset if audio is playing
  function loadRandomPreset() {
    if (!audioElement.paused) {
      const randomPreset = getRandomPreset();
      if (randomPreset) {
        visualizer.loadPreset(randomPreset, 4.0); // Blend over 2 seconds
      }
    }
  }
  // Start random preset switching every 3.5 seconds
  setInterval(loadRandomPreset, 6500);
  visualizerCanvas.width = window.outerWidth;
  visualizerCanvas.height = window.outerHeight;

  function renderVisualizer() {
    if (!isPartyMode) {
      return; // Stop rendering if Party Mode is off
    }
    visualizer.render();
    requestAnimationFrame(renderVisualizer); // Continuously render while Party Mode is active
  }

  audioElement.addEventListener("play", () => {
    audioContext.resume().then(() => {
      if (isPartyMode) {
        requestAnimationFrame(renderVisualizer); // Only render if Party Mode is active
      }
    });
  });

  // Logo Spin Setup
  const logoCircle = document.getElementById("logo-circle");
  const rpm33Button = document.getElementById("rpm-33");
  const rpm45Button = document.getElementById("rpm-45");
  const partyModeButton = document.getElementById("party-toggle");
  const playPauseBtn = document.getElementById("play-pause-btn");

  let isPlaying = false;
  let currentSpeed = 1.818; // Default speed in seconds (33 RPM)
  let targetSpeed = currentSpeed;
  let transitionTimeout;

  // Smooth speed transition function
  function smoothTransitionSpeed(newSpeed, duration = 300) {
    const steps = 30; // Number of transition steps
    const stepTime = duration / steps; // Duration of each step
    const speedIncrement = (newSpeed - currentSpeed) / steps; // Speed increment per step

    clearTimeout(transitionTimeout);

    function stepTransition(step = 0) {
      if (step >= steps) {
        currentSpeed = newSpeed; // Ensure final value is set
        logoCircle.style.animationDuration = `${newSpeed}s`;
        return;
      }

      currentSpeed += speedIncrement;
      logoCircle.style.animationDuration = `${currentSpeed}s`;

      transitionTimeout = setTimeout(() => stepTransition(step + 1), stepTime);
    }

    stepTransition();
  }

  // Function to pause animation (without resetting)
  function pauseAnimation() {
    logoCircle.style.animationPlayState = "paused";
  }

  // Function to resume animation
  function resumeAnimation() {
    logoCircle.style.animationPlayState = "running";
  }

  // RPM Button Handlers
  rpm33Button.addEventListener("click", () => {
    setActiveButton(rpm33Button);
    if (!isPlaying) return; // Only adjust speed if animation is running
    smoothTransitionSpeed(1.818); // Transition to 33 RPM
  });

  rpm45Button.addEventListener("click", () => {
    setActiveButton(rpm45Button);
    if (!isPlaying) return; // Only adjust speed if animation is running
    smoothTransitionSpeed(1.333); // Transition to 45 RPM
  });

  partyModeButton.addEventListener("change", () => {
    isPartyMode = partyModeButton.checked; // Update the flag based on toggle state
    if (!isPartyMode) {
      visualizerCanvas.classList.add("hidden");
    } else {
      visualizerCanvas.classList.remove("hidden");
      requestAnimationFrame(renderVisualizer);
    }
  });

  function setActiveButton(activeButton) {
    const buttons = [rpm33Button, rpm45Button];
    console.log("estts");
    buttons.forEach((button) => {
      const dot = button.querySelector("div");
      if (button === activeButton) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }
    });
  }

  // Play/Pause button handler
  playPauseBtn.addEventListener("click", () => {
    if (isPlaying) {
      pauseAnimation(); // Pause animation
      audioElement.pause(); // Pause audio
      playPauseBtn.innerHTML = `
            <svg
              stroke="currentColor"
              fill="currentColor"
              stroke-width="0"
              viewBox="0 0 32 32"
              height="25px"
              width="25px"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 9 5.15625 L 9 26.84375 L 10.53125 25.84375 L 25.84375 16 L 10.53125 6.15625 Z M 11 8.8125 L 22.15625 16 L 11 23.1875 Z"
              ></path>
            </svg>
        `;
    } else {
      resumeAnimation(); // Resume animation
      audioElement.play(); // Play audio
      playPauseBtn.innerHTML = `
      <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 32 32" height="25px" width="25px" xmlns="http://www.w3.org/2000/svg"><path d="M 10 6 L 10 26 L 12 26 L 12 6 Z M 20 6 L 20 26 L 22 26 L 22 6 Z"></path></svg>
    `;
      logoCircle.style.animationDuration = `${currentSpeed}s`; // Ensure current speed is applied
    }
    isPlaying = !isPlaying;
  });
});
