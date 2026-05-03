dayjs.extend(window.dayjs_plugin_relativeTime);

const container = document.getElementById("task-container");
const checkbox = document.querySelector('input[type="checkbox"]');
const liveAnnouncer = document.getElementById("live-announcer");
// For Modal
const modal = document.getElementById("modalOverlay");
const modalContent = document.querySelector(".modal");
const openBtn = document.getElementById("open-modal");
const closeBtn = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const statusButtons = document.querySelectorAll(".status-toggle button");
const tagsContainer = document.getElementById("tagsContainer");
const tagInput = document.getElementById("tagInput");
const saveBtn = document.getElementById("saveBtn");
// For Delete Toast
let deleteTimer = null;
let itemToDelete = null;

const toast = document.getElementById("undo-toast");
const undoBtn = document.getElementById("undo-btn");
// const progressBar = document.querySelector(".progress-bar");

// openBtn.onclick = function () {
//   modal.style.display = "flex";
// };

// Close Modal functions
const closeModal = () => {
  modal.style.display = "none";
  modal.setAttribute("hidden", "");
  openBtn.focus();
};

const openModal = () => {
  modal.style.display = "flex";
  modal.removeAttribute("hidden");
  document.getElementById("taskTitle").focus();
};

closeBtn.onclick = closeModal;
cancelBtn.onclick = closeModal;
modal.onclick = closeModal;

// Close on Escape Key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.hasAttribute("hidden")) {
    toggleModal(false);
  }
});

// This listener stops the "click" from reaching the overlay
// when you click inside the white modal box
modalContent.addEventListener("click", (event) => {
  event.stopPropagation();
});

// Handle Status Toggle UI
statusButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Reset all buttons in the group
    statusButtons.forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-checked", "false");
    });
    // Set clicked button to active
    btn.classList.add("active");
    btn.setAttribute("aria-checked", "true");
  });
});

statusButtons.forEach((btn) => {
  btn.addEventListener("mouseover", () => {
    console.log(`Mouse over: ${btn.textContent.trim().toLowerCase()}`);
    btn.classList.add(
      `status-${btn.textContent.trim().toLowerCase().replace(/\s+/g, "-")}`,
    );
  });
  btn.addEventListener("mouseout", () => {
    console.log(`Mouse out: ${btn.textContent.trim().toLowerCase()}`);
    btn.classList.remove(
      `status-${btn.textContent.trim().toLowerCase().replace(/\s+/g, "-")}`,
    );
  });
});

// Accessibility: Focus Trap
modal.addEventListener("keydown", function (e) {
  if (e.key !== "Tab") return;

  const focusables = modal.querySelectorAll("button, input, textarea, select");
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    last.focus();
    e.preventDefault();
  } else if (!e.shiftKey && document.activeElement === last) {
    first.focus();
    e.preventDefault();
  }
});

// Initial state
let tags = [];
const tagListed = document.querySelectorAll(".classification-tags .tag");
tagListed.forEach((tag) => {
  let tagContent = tag.textContent.replace("#", "");
  tags.push(tagContent);
});
console.log(tags);

// function getTagsState() {
//   tags = [];
//   const tagListed = document.querySelectorAll(".tag");
//   tagListed.forEach((tag) => {
//     let tagContent = tag.textContent.replace("#", "");
//     tags.push(tagContent);
//   });
// }

// Function to render tags to the DOM
function renderTags() {
  // 1. Remove all existing tags (but keep the input field)
  // const existingTags = tagsContainer.querySelectorAll(
  //   ".classification-tags .tag",
  // );
  tagsContainer.querySelectorAll(".tag").forEach((tag) => tag.remove());
  // 2. Create and insert new tag elements
  tags.forEach((tagText, index) => {
    const tagElement = document.createElement("span");
    // Apply classes based on index or text (alternating colors for demo)
    const colorClass = index % 2 === 0 ? "blue" : "purple";
    tagElement.classList.add("tag", colorClass);

    tagElement.innerHTML = `
            ${tagText}
            <button type="button" aria-label="Remove ${tagText}" data-index="${index}">&times;</button>
        `;

    // Insert before the input field
    tagsContainer.insertBefore(tagElement, tagInput);
  });
}

// Add Tag Logic
tagInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault(); // Prevent form submission
    const val = tagInput.value.trim();

    if (val && !tags.includes(val)) {
      tags.push(val);
      tagInput.value = "";
      renderTags();
    }
  }

  // Optional: Remove last tag on Backspace if input is empty
  // if (e.key === "Backspace" && tagInput.value === "" && tags.length > 0) {
  //   tags.pop();
  //   renderTags();
  // }
});

// Remove Tag Logic (Event Delegation)
tagsContainer.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    const indexToRemove = e.target.getAttribute("data-index");
    tags.splice(indexToRemove, 1);
    renderTags();
  }
});

// Initial render
renderTags();

// Save Edit to card
// Variable to keep track of which card is currently being edited
let activeCard = null;

// 1. SELECTING THE CARD WHEN EDIT IS CLICKED
document.addEventListener("click", (e) => {
  // Find the closest edit button (using delegation for multiple cards)
  const editBtn = e.target.closest('[data-testid="test-todo-edit-button"]');
  const deleteBtn = e.target.closest('[data-testid="test-todo-delete-button"]');

  if (editBtn) {
    // Find the specific card parent for this button
    activeCard = editBtn.closest('[data-testid="test-todo-card"]');

    // POPULATE MODAL (Optional but recommended)
    // Extract current data from the activeCard to fill form fields
    document.getElementById("taskTitle").value = activeCard.querySelector(
      '[data-testid="test-todo-title"]',
    ).innerText;
    document.getElementById("taskDesc").value = activeCard
      .querySelector('[data-testid="test-todo-description"]')
      .textContent.replace(/\s+/g, " ")
      .trim();
    document.getElementById("dueDate").value =
      activeCard.getAttribute("data-due");
    document.getElementById("priority").value =
      activeCard.getAttribute("data-priority");
    document.querySelectorAll('button[role="radio"]').forEach((btn) => {
      btn.classList.remove("active");
      console.log(
        "Status button:",
        btn.textContent.trim().toLowerCase().replace("completed", "done"),
      );
      console.log(
        "Card status:",
        activeCard
          .querySelector('[data-testid="test-todo-status"]')
          .textContent.trim()
          .toLowerCase(),
      );
      console.log(
        "Compare status button:",
        btn.textContent
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase()
          .replace("completed", "done") ==
          activeCard
            .querySelector('[data-testid="test-todo-status"]')
            .textContent.replace(/\s+/g, " ")
            .trim()
            .toLowerCase(),
      );
      if (
        btn.textContent
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase()
          .replace("completed", "done") ==
        activeCard
          .querySelector('[data-testid="test-todo-status"]')
          .textContent.replace(/\s+/g, " ")
          .trim()
          .toLowerCase()
      ) {
        console.log("Setting active status button:", btn.textContent);
        btn.classList.add("active");
      }
    });

    // ... populate priority, date, and tags similarly ...

    openModal(); // Your existing function to show modal
  }

  // if (deleteBtn) {
  //   const card = deleteBtn.closest('[data-testid="test-todo-card"]');
  //   itemToDelete = card;

  //   // // 1. Reset & Restart Animation
  //   // // By removing and re-adding the progress bar, the browser restarts the CSS 'shrink'
  //   // const newBar = progressBar.cloneNode(true);
  //   // progressBar.parentNode.replaceChild(newBar, progressBar);

  //   // FIX: Query the bar inside the function so it's always the current one
  //   const currentBar = toast.querySelector(".progress-bar");

  //   const newBar = currentBar.cloneNode(true);
  //   currentBar.parentNode.replaceChild(newBar, currentBar);

  //   // 1. Optimistic UI: Hide immediately
  //   card.style.display = "none";

  //   // 2. Show Toast through animation & Manage Focus
  //   toast.classList.remove("toast-hidden");
  //   toast.style.animation = "show 0.3s ease";
  //   setTimeout(() => {
  //     undoBtn.focus();
  //     // Log to console to verify it actually grabbed focus
  //     console.log("Focused element:", document.activeElement);
  //   }, 10);

  //   // 3. Set the "Permanent" deletion timer
  //   deleteTimer = setTimeout(() => {
  //     confirmDeletion();
  //   }, 5000);
  // }
});

const deleteBtns = document.querySelectorAll(
  '[data-testid="test-todo-delete-button"]',
);

// Change 'click' to 'mousedown'
deleteBtns.forEach((deleteBtn) => {
  deleteBtn.addEventListener("click", (e) => {
    // 1. Prevent the browser from committing focus to the clicked button
    // e.preventDefault();

    const card = deleteBtn.closest('[data-testid="test-todo-card"]');
    itemToDelete = card;

    // 2. Restart your animation logic
    const currentBar = toast.querySelector(".progress-bar");
    const newBar = currentBar.cloneNode(true);
    currentBar.parentNode.replaceChild(newBar, currentBar);

    // 3. UI Updates
    card.style.display = "none";
    toast.classList.remove("toast-hidden");
    toast.style.animation = "show 0.3s ease";

    // 4. Focus is now safe to move
    setTimeout(() => {
      undoBtn.focus();
      console.log("Focused element:", document.activeElement);
    }, 30);

    // 5. Start timer
    deleteTimer = setTimeout(() => {
      confirmDeletion();
    }, 5000);
  });
});

// 2. UPDATING THE CARD ON SUBMIT
// let dateTimes = ["2026-04-17T15:00:00"];
saveBtn.addEventListener("click", (e) => {
  e.preventDefault(); // Prevent form reload

  if (!activeCard) return;

  // A. Grab the new values from the Modal Form
  const newTitle = document.getElementById("taskTitle").value;
  const newDesc = document.getElementById("taskDesc").value;
  const newDate = document.getElementById("dueDate").value;
  const newPriority = document.getElementById("priority").value.toLowerCase();
  // B. Update the specific elements WITHIN the activeCard
  // Note: We use activeCard.querySelector() so it doesn't affect other cards
  activeCard.querySelector('[data-testid="test-todo-title"]').innerText =
    newTitle;
  activeCard.querySelector('[data-testid="test-todo-description"]').innerText =
    newDesc;

  const dateEl = activeCard.querySelector('[data-testid="test-todo-due-date"]');
  // Format date to "month day, year" format
  const dateObj = new Date(newDate);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  dateEl.innerText = formattedDate;
  // Update datetime attribute for accessibility
  dateEl.setAttribute("datetime", newDate);
  // Update time remaining
  dateTimes = [];
  dateTimes.push(newDate);
  activeCard.setAttribute("data-due", newDate);
  updateAllTimestamps();

  // C. Update Priority Visuals
  // Remove old priority classes and add the new one
  activeCard.classList.remove(
    "priority-low",
    "priority-medium",
    "priority-high",
  );
  activeCard.classList.add(`priority-${newPriority}`);

  // Update the visual indicator icon/text if necessary
  const priorityIconGroup = activeCard.querySelector(".title-content");
  priorityIconGroup.className = `title-content ${newPriority}-priority`;
  setupPriorityIcons();

  // Update status pill text and color based on priority (if you want to reflect priority in status)
  const statusPill = activeCard.querySelector(
    '[data-testid="test-todo-status"]',
  );
  // if (newPriority === "high") {
  //   statusPill.textContent = "HIGH PRIORITY";
  //   statusPill.className = "badge status-high";
  // } else if (newPriority === "medium") {
  //   statusPill.textContent = "MEDIUM PRIORITY";
  //   statusPill.className = "badge status-medium";
  // } else {
  //   statusPill.textContent = "LOW PRIORITY";
  //   statusPill.className = "badge status-low";
  // }

  // Update status pill text based on status button with active class
  const activeStatusBtn = document.querySelector(
    ".status-toggle button.active",
  );
  console.log(activeStatusBtn, statusPill, activeStatusBtn.textContent.trim());
  if (activeStatusBtn.textContent.trim() !== "Completed") {
    if (activeCard.classList.contains("is-completed")) {
      activeCard.classList.remove("is-completed");
      // liveAnnouncer.textContent = "Task marked as not completed";
      checkbox.checked = false; // Uncheck the checkbox if status is not "Completed"
    }
    const statusText = activeStatusBtn.textContent.trim().toUpperCase();
    statusPill.textContent = statusText;
    statusPill.className = `badge status-${statusText.toLowerCase().replace(/\s+/g, "-")}`;
    liveAnnouncer.textContent = `Task marked as ${statusText.toLowerCase()}`;
  } else if (activeStatusBtn.textContent.trim() === "Completed") {
    console.log("Toggling checkbox for Completed status");
    checkbox.click(); // If "Completed" is selected, toggle the checkbox to mark as done
  }

  // D. Update Tags (Assuming you are using the tag system from previous step)
  const tagListUI = activeCard.querySelector('[data-testid="test-todo-tags"]');
  tagListUI.innerHTML = ""; // Clear old tags

  // 'tags' is the array from your tag-adding logic
  tags.forEach((tagText) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="tag">#${tagText}</span>`;
    tagListUI.appendChild(li);
  });

  // Close modal and reset
  closeModal();
  activeCard = null;
});

// Wrap heavy initialization in requestIdleCallback
// This tells the browser: "Do this only when you aren't busy with important stuff"
window.requestIdleCallback(() => {
  setupPriorityIcons();
  updateAllTimestamps();
});

let dateTimes = [
  // "2026-04-17T15:00:00",
  // "2026-04-21T09:00:00",
  "2026-05-01T17:00:00",
]; // Example due dates

function setupPriorityIcons() {
  const titleIconWrappers = document.querySelectorAll(
    ".title .title-content .icon",
  );
  // Optimization: Use a DocumentFragment or pre-defined strings to minimize reflow
  titleIconWrappers.forEach((wrapper) => {
    let svgPath = "";
    let color = "";
    if (wrapper.parentNode.classList.contains("high-priority")) {
      svgPath =
        // "m282-225-42-42 240-240 240 240-42 42-198-198-198 198Zm0-253-42-42 240-240 240 240-42 42-198-198-198 198Z";
        "M445.93-325.78h68.14v-178.89l72.56 72.56 47.98-47.74L480-634.22 325.39-479.85l47.98 47.74 72.56-72.56v178.89Zm34.1 251.76q-83.46 0-157.54-31.88-74.07-31.88-129.39-87.2-55.32-55.32-87.2-129.36-31.88-74.04-31.88-157.51 0-84.46 31.88-158.54 31.88-74.07 87.16-128.9 55.28-54.84 129.34-86.82 74.06-31.99 157.55-31.99 84.48 0 158.59 31.97 74.1 31.97 128.91 86.77 54.82 54.8 86.79 128.88 31.98 74.08 31.98 158.6 0 83.5-31.99 157.57-31.98 74.07-86.82 129.36-54.83 55.29-128.87 87.17-74.04 31.88-158.51 31.88Zm-.03-68.13q141.04 0 239.45-98.75 98.4-98.76 98.4-239.1 0-141.04-98.4-239.45-98.41-98.4-239.57-98.4-140.16 0-238.95 98.4-98.78 98.41-98.78 239.57 0 140.16 98.75 238.95 98.76 98.78 239.1 98.78ZM480-480Z";
      color = "var(--priority-high)";
    } else if (wrapper.parentNode.classList.contains("medium-priority")) {
      // svgPath = "M480-554 283-357l-43-43 240-240 240 240-43 43-197-197Z";
      svgPath =
        "M612-348q54-54 54-132t-54-132q-54-54-132-54t-132 54q-54 54-54 132t54 132q54 54 132 54t132-54ZM480.03-74.02q-83.46 0-157.54-31.88-74.07-31.88-129.39-87.2-55.32-55.32-87.2-129.36-31.88-74.04-31.88-157.51 0-84.46 31.88-158.54 31.88-74.07 87.16-128.9 55.28-54.84 129.34-86.82 74.06-31.99 157.55-31.99 84.48 0 158.59 31.97 74.1 31.97 128.91 86.77 54.82 54.8 86.79 128.88 31.98 74.08 31.98 158.6 0 83.5-31.99 157.57-31.98 74.07-86.82 129.36-54.83 55.29-128.87 87.17-74.04 31.88-158.51 31.88Zm-.03-68.13q141.04 0 239.45-98.75 98.4-98.76 98.4-239.1 0-141.04-98.4-239.45-98.41-98.4-239.57-98.4-140.16 0-238.95 98.4-98.78 98.41-98.78 239.57 0 140.16 98.75 238.95 98.76 98.78 239.1 98.78Z";
      color = "var(--priority-medium)";
    } else if (wrapper.parentNode.classList.contains("low-priority")) {
      // svgPath = "M480-344 240-584l43-43 197 197 197-197 43 43-240 240Z";
      svgPath =
        "m480-325.78 154.61-154.37-47.98-47.74-72.56 72.56v-178.89h-68.14v178.89l-72.56-72.56-47.98 47.74L480-325.78Zm.03 251.76q-83.46 0-157.54-31.88-74.07-31.88-129.39-87.2-55.32-55.32-87.2-129.36-31.88-74.04-31.88-157.51 0-84.46 31.88-158.54 31.88-74.07 87.16-128.9 55.28-54.84 129.34-86.82 74.06-31.99 157.55-31.99 84.48 0 158.59 31.97 74.1 31.97 128.91 86.77 54.82 54.8 86.79 128.88 31.98 74.08 31.98 158.6 0 83.5-31.99 157.57-31.98 74.07-86.82 129.36-54.83 55.29-128.87 87.17-74.04 31.88-158.51 31.88Zm-.03-68.13q141.04 0 239.45-98.75 98.4-98.76 98.4-239.1 0-141.04-98.4-239.45-98.41-98.4-239.57-98.4-140.16 0-238.95 98.4-98.78 98.41-98.78 239.57 0 140.16 98.75 238.95 98.76 98.78 239.1 98.78ZM480-480Z";
      color = "var(--priority-low)";
    }

    if (svgPath) {
      wrapper.style.backgroundColor = "transparent"; // Ensure background is transparent for the icon
      wrapper.style.animation = "none"; // Disable animation for priority icons
      // wrapper.insertAdjacentHTML(
      //   "afterbegin",
      //   `<svg data-testid="test-todo-priority" height="48px" viewBox="0 -960 960 960" width="48px" fill="${color}"><path d="${svgPath}"/></svg>`,
      // );

      wrapper.innerHTML = `<svg data-testid="test-todo-priority" height="48px" viewBox="0 -960 960 960" width="48px" fill="${color}"><path d="${svgPath}"/></svg>`;
    }
  });
}

function updateAllTimestamps() {
  dateTimes.forEach((dueDate) => {
    const timeData = getTimeRemaining(dueDate);
    console.log(timeData);
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
      liveAnnouncer.textContent = `Task marked as ${statusPill.textContent.toLowerCase()}`;
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
    const title = card.querySelector(".card-content .title");
    const content = card.querySelector(".card-content p");
    const button = event.target;

    if (window.getComputedStyle(content).display === "none") {
      content.style.display = "block";
      title.style.marginBlockEnd = "0";
      button.textContent = "See Less";
      button.setAttribute("aria-expanded", "true");
      content.hidden = false;
    } else {
      content.style.display = "none";
      title.style.marginBlockEnd = "1em";
      button.textContent = "See More";
      button.setAttribute("aria-expanded", "false");
      content.hidden = true;
    }
  }
  // else if (event.target.classList.contains("edit")) {

  //   openModal();
  // }
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
    text: `Due ${target.from(now)}`,
    color: colorVar,
  };
}

// script for the toast notification
// let deleteTimer = null;
// let itemToDelete = null;

// const toast = document.getElementById("undo-toast");
// const undoBtn = document.getElementById("undo-btn");

// document.querySelector(".delete-btn").addEventListener("click", (e) => {
//   const card = e.target.closest(".task-card");
//   itemToDelete = card;

//   // // 1. Optimistic UI: Hide immediately
//   // card.style.display = "none";

//   // // 2. Show Toast & Manage Focus
//   // toast.classList.remove("toast-hidden");
//   // undoBtn.focus();

//   // // 3. Set the "Permanent" deletion timer
//   // deleteTimer = setTimeout(() => {
//   //   confirmDeletion();
//   // }, 5000);
// });

function triggerUndo() {
  if (deleteTimer) {
    clearTimeout(deleteTimer);

    // Return focus to the delete button of the restored item
    console.log(
      itemToDelete.querySelector('[data-testid="test-todo-delete-button"]'),
      itemToDelete.querySelector('[data-testid="test-todo-delete-button"]')
        .focus,
    );
    // itemToDelete
    //   .querySelector('[data-testid="test-todo-delete-button"]')
    //   .focus();
    console.log("Time up");
    // itemToDelete
    //   .querySelector('[data-testid="test-todo-delete-button"]')
    //   .focus();

    // Restore UI
    itemToDelete.style.display = "block";
    toast.classList.add("toast-hidden");
    toast.style.animation = "hide 0.3s ease"; // Play hide animation immediately
    itemToDelete
      .querySelector('[data-testid="test-todo-delete-button"]')
      .focus();
    console.log("Focused element:", document.activeElement);
    itemToDelete = null;
  }
}

// Global Keyboard Shortcut: Ctrl + Z
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "z") {
    e.preventDefault(); // Prevent browser undo logic
    triggerUndo();
  }
  if (e.key === "Enter") {
    const deleteBtn = e.target.closest(
      '[data-testid="test-todo-delete-button"]',
    );
    if (deleteBtn) {
      console.log("Enter key detected on delete button!");
      // Manually trigger the logic if needed
      deleteBtn.click();
    }
  }
});

undoBtn.addEventListener("click", triggerUndo);

function confirmDeletion() {
  if (itemToDelete) {
    console.log("Deleted from DB:", itemToDelete.dataset.id);
    itemToDelete.remove();
    toast.classList.add("toast-hidden");
    itemToDelete = null;
  }
}
