export function createModalDialog({ modal, closeButton, fallbackFocus, onOpen, onClose }) {
  let lastTrigger = null;

  function open() {
    if (!modal) return;

    lastTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    onOpen?.();
    modal.classList.add("is-open");
    modal.inert = false;
    modal.setAttribute("aria-hidden", "false");
    closeButton?.focus({ preventScroll: true });
  }

  function close() {
    if (!modal) return;

    const focusTarget = lastTrigger && document.contains(lastTrigger) ? lastTrigger : fallbackFocus?.();
    if (modal.contains(document.activeElement) && focusTarget) {
      focusTarget.focus({ preventScroll: true });
    }
    modal.classList.remove("is-open");
    modal.inert = true;
    modal.setAttribute("aria-hidden", "true");
    onClose?.();
  }

  function isOpen() {
    return Boolean(modal?.classList.contains("is-open"));
  }

  function init() {
    if (!modal) return;

    modal.inert = true;
    closeButton?.addEventListener("click", close);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        close();
      }
    });
  }

  return { close, init, isOpen, open };
}
