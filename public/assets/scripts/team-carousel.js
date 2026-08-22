import { preloadImage } from "./utils.js";

export function createTeamCarousel({
  carousel,
  deck,
  nav,
  count,
  previousButton,
  nextButton,
  closeButton,
  teamMembers,
  canOpen,
  fallbackFocus
}) {
  let activeIndex = 0;
  let cardsBuilt = false;
  let activeSwipe = null;
  let suppressCardClick = false;
  let lastTrigger = null;
  const imagePreloads = new Map();
  const swipeMinDistance = 44;
  const swipeMaxVerticalRatio = 0.8;

  function preloadImages() {
    teamMembers.forEach((teamMember) => {
      if (imagePreloads.has(teamMember.image)) return;
      imagePreloads.set(teamMember.image, preloadImage(teamMember.image));
    });
  }

  function buildCards() {
    if (!deck || cardsBuilt) return;

    const cards = teamMembers.map((teamMember, index) => {
      const card = document.createElement("article");
      card.className = "team-card";
      card.dataset.index = String(index);
      card.innerHTML = `
        <div class="team-card__media">
          <img class="team-card__photo" src="${teamMember.image}" alt="${teamMember.imageAlt || `Portrait of ${teamMember.name}, ${teamMember.role} at Therapy House`}" width="720" height="900" loading="eager" decoding="async" draggable="false">
        </div>
        <div class="team-card__body">
          <header>
            <p class="team-card__eyebrow">Therapy House team</p>
            <h3 class="team-card__name">${teamMember.name}</h3>
            <p class="team-card__role">${teamMember.role}</p>
          </header>
          <div class="team-card__content">
            <p class="team-card__summary">${teamMember.summary}</p>
            <p class="team-card__bio">${teamMember.bio}</p>
          </div>
        </div>
      `;
      return card;
    });

    deck.replaceChildren(...cards);
    cardsBuilt = true;
  }

  function renderMember() {
    const member = teamMembers[activeIndex];
    if (!member) return;

    buildCards();

    if (deck) {
      const total = teamMembers.length;
      Array.from(deck.children).forEach((card) => {
        const index = Number(card.dataset.index);
        const offset = (index - activeIndex + total) % total;
        const reverseOffset = (activeIndex - index + total) % total;
        const isActive = index === activeIndex;

        card.className = "team-card";
        if (isActive) {
          card.classList.add("is-active");
        } else if (offset === 1) {
          card.classList.add("is-next");
        } else if (reverseOffset === 1) {
          card.classList.add("is-prev");
        } else if (offset === 2) {
          card.classList.add("is-far-next");
        } else if (reverseOffset === 2) {
          card.classList.add("is-far-prev");
        }

        card.setAttribute("aria-hidden", isActive ? "false" : "true");
        card.tabIndex = isActive ? 0 : -1;
      });

      const activeCardBody = deck.querySelector(".team-card.is-active .team-card__body");
      if (activeCardBody && nav && nav.parentElement !== activeCardBody) {
        activeCardBody.appendChild(nav);
      }
    }

    if (count) {
      count.textContent = `${activeIndex + 1} of ${teamMembers.length}`;
    }
  }

  function showMember(offset) {
    activeIndex = (activeIndex + offset + teamMembers.length) % teamMembers.length;
    renderMember();
  }

  function open() {
    if (!carousel || !canOpen()) return;

    preloadImages();
    lastTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    activeIndex = 0;
    renderMember();
    carousel.hidden = false;
    carousel.classList.add("is-open");
    carousel.inert = false;
    carousel.setAttribute("aria-hidden", "false");
    closeButton?.focus({ preventScroll: true });
  }

  function close() {
    if (!carousel) return;

    const focusTarget = lastTrigger && document.contains(lastTrigger) ? lastTrigger : fallbackFocus?.();
    if (carousel.contains(document.activeElement) && focusTarget) {
      focusTarget.focus({ preventScroll: true });
    }
    carousel.classList.remove("is-open");
    carousel.inert = true;
    carousel.setAttribute("aria-hidden", "true");
    carousel.hidden = true;
  }

  function isOpen() {
    return Boolean(carousel?.classList.contains("is-open"));
  }

  function beginSwipe(event) {
    if (!carousel.classList.contains("is-open")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target.closest(".team-carousel__button, .team-carousel__close")) return;

    activeSwipe = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY
    };

    if (typeof deck.setPointerCapture === "function") {
      deck.setPointerCapture(event.pointerId);
    }
  }

  function updateSwipe(event) {
    if (!activeSwipe || event.pointerId !== activeSwipe.pointerId) return;
    activeSwipe.currentX = event.clientX;
    activeSwipe.currentY = event.clientY;
  }

  function finishSwipe(event) {
    if (!activeSwipe || event.pointerId !== activeSwipe.pointerId) return;

    const endX = Number.isFinite(activeSwipe.currentX) ? activeSwipe.currentX : event.clientX;
    const endY = Number.isFinite(activeSwipe.currentY) ? activeSwipe.currentY : event.clientY;
    const deltaX = endX - activeSwipe.startX;
    const deltaY = endY - activeSwipe.startY;
    activeSwipe = null;

    if (typeof deck.releasePointerCapture === "function" && deck.hasPointerCapture(event.pointerId)) {
      deck.releasePointerCapture(event.pointerId);
    }

    const horizontalTravel = Math.abs(deltaX);
    const verticalTravel = Math.abs(deltaY);
    if (horizontalTravel < swipeMinDistance || verticalTravel > horizontalTravel * swipeMaxVerticalRatio) return;

    suppressCardClick = true;
    showMember(deltaX < 0 ? 1 : -1);
    event.preventDefault();

    window.setTimeout(() => {
      suppressCardClick = false;
    }, 280);
  }

  function cancelSwipe(event) {
    if (!activeSwipe || event.pointerId !== activeSwipe.pointerId) return;
    activeSwipe = null;
  }

  function handleDeckClick(event) {
    if (suppressCardClick) {
      event.preventDefault();
      return;
    }

    const card = event.target.closest(".team-card");
    if (!card) return;

    if (card.classList.contains("is-prev")) {
      showMember(-1);
    } else if (card.classList.contains("is-next")) {
      showMember(1);
    }
  }

  function init() {
    if (!carousel || !deck) return;

    carousel.hidden = true;
    carousel.inert = true;
    previousButton?.addEventListener("click", () => showMember(-1));
    nextButton?.addEventListener("click", () => showMember(1));
    closeButton?.addEventListener("click", close);
    deck.addEventListener("pointerdown", beginSwipe);
    deck.addEventListener("pointermove", updateSwipe);
    deck.addEventListener("pointerup", finishSwipe);
    deck.addEventListener("pointercancel", cancelSwipe);
    deck.addEventListener("dragstart", (event) => event.preventDefault());
    deck.addEventListener("click", handleDeckClick);
    carousel.addEventListener("click", (event) => {
      if (event.target === carousel) {
        close();
      }
    });
  }

  return {
    close,
    init,
    isOpen,
    open,
    preloadImages,
    showMember
  };
}
