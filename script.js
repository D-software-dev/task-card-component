dayjs.extend(window.dayjs_plugin_relativeTime);

const container = document.getElementById("task-container");
const liveAnnouncer = document.getElementById("live-announcer");
// Wrap heavy initialization in requestIdleCallback
// This tells the browser: "Do this only when you aren't busy with important stuff"
window.requestIdleCallback(() => {
  setupPriorityIcons();
  updateAllTimestamps();
});

const dateTimes = [
  "2026-04-17T15:00:00",
  "2026-04-21T09:00:00",
  "2026-05-01T17:00:00",
]; // Example due dates

function setupPriorityIcons() {
  const todoTitleWrappers = document.querySelectorAll(".title .title-content");
  // Optimization: Use a DocumentFragment or pre-defined strings to minimize reflow
  todoTitleWrappers.forEach((wrapper) => {
    let svgPath = "";
    let color = "";

    if (wrapper.classList.contains("high-priority")) {
      svgPath =
        // "m282-225-42-42 240-240 240 240-42 42-198-198-198 198Zm0-253-42-42 240-240 240 240-42 42-198-198-198 198Z";
        "M445.93-325.78h68.14v-178.89l72.56 72.56 47.98-47.74L480-634.22 325.39-479.85l47.98 47.74 72.56-72.56v178.89Zm34.1 251.76q-83.46 0-157.54-31.88-74.07-31.88-129.39-87.2-55.32-55.32-87.2-129.36-31.88-74.04-31.88-157.51 0-84.46 31.88-158.54 31.88-74.07 87.16-128.9 55.28-54.84 129.34-86.82 74.06-31.99 157.55-31.99 84.48 0 158.59 31.97 74.1 31.97 128.91 86.77 54.82 54.8 86.79 128.88 31.98 74.08 31.98 158.6 0 83.5-31.99 157.57-31.98 74.07-86.82 129.36-54.83 55.29-128.87 87.17-74.04 31.88-158.51 31.88Zm-.03-68.13q141.04 0 239.45-98.75 98.4-98.76 98.4-239.1 0-141.04-98.4-239.45-98.41-98.4-239.57-98.4-140.16 0-238.95 98.4-98.78 98.41-98.78 239.57 0 140.16 98.75 238.95 98.76 98.78 239.1 98.78ZM480-480Z";
      color = "var(--priority-high)";
    } else if (wrapper.classList.contains("medium-priority")) {
      // svgPath = "M480-554 283-357l-43-43 240-240 240 240-43 43-197-197Z";
      svgPath =
        "M612-348q54-54 54-132t-54-132q-54-54-132-54t-132 54q-54 54-54 132t54 132q54 54 132 54t132-54ZM480.03-74.02q-83.46 0-157.54-31.88-74.07-31.88-129.39-87.2-55.32-55.32-87.2-129.36-31.88-74.04-31.88-157.51 0-84.46 31.88-158.54 31.88-74.07 87.16-128.9 55.28-54.84 129.34-86.82 74.06-31.99 157.55-31.99 84.48 0 158.59 31.97 74.1 31.97 128.91 86.77 54.82 54.8 86.79 128.88 31.98 74.08 31.98 158.6 0 83.5-31.99 157.57-31.98 74.07-86.82 129.36-54.83 55.29-128.87 87.17-74.04 31.88-158.51 31.88Zm-.03-68.13q141.04 0 239.45-98.75 98.4-98.76 98.4-239.1 0-141.04-98.4-239.45-98.41-98.4-239.57-98.4-140.16 0-238.95 98.4-98.78 98.41-98.78 239.57 0 140.16 98.75 238.95 98.76 98.78 239.1 98.78Z";
      color = "var(--priority-medium)";
    } else if (wrapper.classList.contains("low-priority")) {
      // svgPath = "M480-344 240-584l43-43 197 197 197-197 43 43-240 240Z";
      svgPath =
        "m480-325.78 154.61-154.37-47.98-47.74-72.56 72.56v-178.89h-68.14v178.89l-72.56-72.56-47.98 47.74L480-325.78Zm.03 251.76q-83.46 0-157.54-31.88-74.07-31.88-129.39-87.2-55.32-55.32-87.2-129.36-31.88-74.04-31.88-157.51 0-84.46 31.88-158.54 31.88-74.07 87.16-128.9 55.28-54.84 129.34-86.82 74.06-31.99 157.55-31.99 84.48 0 158.59 31.97 74.1 31.97 128.91 86.77 54.82 54.8 86.79 128.88 31.98 74.08 31.98 158.6 0 83.5-31.99 157.57-31.98 74.07-86.82 129.36-54.83 55.29-128.87 87.17-74.04 31.88-158.51 31.88Zm-.03-68.13q141.04 0 239.45-98.75 98.4-98.76 98.4-239.1 0-141.04-98.4-239.45-98.41-98.4-239.57-98.4-140.16 0-238.95 98.4-98.78 98.41-98.78 239.57 0 140.16 98.75 238.95 98.76 98.78 239.1 98.78ZM480-480Z";
      color = "var(--priority-low)";
    }

    if (svgPath) {
      wrapper.insertAdjacentHTML(
        "afterbegin",
        `<svg data-testid="test-todo-priority" height="48px" viewBox="0 -960 960 960" width="48px" fill="${color}"><path d="${svgPath}"/></svg>`,
      );
    }
  });
}

function updateAllTimestamps() {
  dateTimes.forEach((dueDate) => {
    const timeData = getTimeRemaining(dueDate);
    // Optimization: Target specific cards using ID or data-attribute directly
    const card = document.querySelector(`.card[data-due="${dueDate}"]`);
    if (card) {
      const timeElement = card.querySelector(".time-remaining");
      const timeLeft = timeElement.querySelector("time.time-left");
      const icon = timeElement.querySelector("svg");

      // Batch DOM updates
      timeLeft.textContent = timeData.text;
      timeLeft.style.color = timeData.color;
      icon.style.fill = timeData.color;
    }
  });
}

// Update time data every minute to keep it accurate
setInterval(updateAllTimestamps, 60000); // Update every 60 seconds

container.addEventListener("change", (event) => {
  // 1. Ensure we are only acting on checkboxes
  if (event.target.type === "checkbox") {
    // 2. Scope everything to the specific card that contains this checkbox
    const card = event.target.closest(".card");
    const statusPill = card.querySelector(".badge");

    if (event.target.checked) {
      // Store the current status in a data attribute before changing it
      // so we know what to revert to later
      card.dataset.oldStatus = statusPill.textContent.trim();

      card.classList.add("is-completed");
      statusPill.textContent = "DONE";
      liveAnnouncer.textContent = "Task marked as completed";
    } else {
      card.classList.remove("is-completed");

      // Revert to the status we saved earlier, or default to 'OPEN'
      statusPill.textContent = card.dataset.oldStatus || "OPEN";
      liveAnnouncer.textContent = "Task marked as not completed";
    }
  }
});

// Adds the Enter key functionality to toggle the checkboxes for better keyboard accessibility
container.addEventListener("keydown", (event) => {
  if (event.target.type === "checkbox" && event.key === "Enter") {
    event.preventDefault(); // Prevent form submission or other default actions
    event.target.click(); // Simulate a click to toggle the checkbox and trigger the change event
  }
});

// Adds event delegation for the "toggle-btn" buttons
container.addEventListener("click", (event) => {
  if (event.target.classList.contains("toggle-btn")) {
    const card = event.target.closest(".card");
    const content = card.querySelector(".card-content p");
    const button = event.target;

    if (window.getComputedStyle(content).display === "none") {
      content.style.display = "block";
      button.textContent = "See Less";
      button.setAttribute("aria-expanded", "true");
      content.hidden = false;
    } else {
      content.style.display = "none";
      button.textContent = "See More";
      button.setAttribute("aria-expanded", "false");
      content.hidden = true;
    }
  } else if (
    event.target.classList.contains("edit") ||
    event.target.classList.contains("delete")
  ) {
    // Handle edit and delete button clicks here
    alert(
      `${event.target.classList.contains("edit") ? "Edit" : "Delete"} button clicked.`,
    );
  }
});

// Time Remaining Countdown Logic
function getTimeRemaining(dueDate) {
  const now = dayjs();
  const target = dayjs(dueDate);

  // 1. Calculate the difference in hours
  const hoursDiff = target.diff(now, "hour");

  // 2. Determine the color variable
  let colorVar = "var(--time-safe)"; // Default Slate/Grey

  if (target.isBefore(now)) {
    colorVar = "var(--time-critical)"; // Overdue Red
  } else if (hoursDiff < 24) {
    colorVar = "var(--time-critical)"; // Less than 24hrs Red
  } else if (hoursDiff < 72) {
    colorVar = "var(--time-warning)"; // Less than 3 days Orange
  }

  // 3. Return the "Human" string (e.g., "in 2 hours", "3 days ago")
  return {
    text: target.from(now),
    color: colorVar,
  };
}
