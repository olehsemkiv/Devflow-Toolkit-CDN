// src/modules/modal.js
(function () {
  if (!window.RS || !window.RS.register) {
    console.warn("[RS] core is missing. Include rs-core.min.js first.");
    return;
  }

  const SELECTORS = {
    modal: "[data-rs-modal]",
    open: "[data-rs-modal-open]",
    close: "[data-rs-modal-close]",
    overlay: "[data-rs-modal-overlay], .modal_overlay",
    content: "[data-rs-modal-content], .modal_content",
  };

  const STATE = {
    open: "is-open",
    htmlLocked: "is-modal-open",
  };

  // Escape helper
  const cssEscape =
    (window.CSS && CSS.escape) ||
    function (str) {
      return String(str).replace(/["\\#.:?[\]()\s]/g, "\\$&");
    };

  let activeModal = null;
  let lastTrigger = null;

  // scroll lock (only when modal has data-rs-modal-lock="true")
  const lockState = {
    locked: false,
    scrollY: 0,
    prev: {},
  };

  function isTrue(val) {
    const v = String(val || "").toLowerCase().trim();
    return v === "true" || v === "1" || v === "yes";
  }

  function shouldLock(modal) {
    if (!modal) return false;
    // if attribute missing => DO NOT lock
    if (!modal.hasAttribute("data-rs-modal-lock")) return false;
    return isTrue(modal.getAttribute("data-rs-modal-lock"));
  }

  function lockScroll() {
    if (lockState.locked) return;

    const html = document.documentElement;
    const body = document.body;

    lockState.scrollY = window.scrollY || 0;

    lockState.prev = {
      htmlOverflow: html.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyOverflow: body.style.overflow,
    };

    // iOS-safe lock: body fixed
    body.style.position = "fixed";
    body.style.top = `-${lockState.scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    html.classList.add(STATE.htmlLocked);

    lockState.locked = true;
  }

  function unlockScroll() {
    if (!lockState.locked) return;

    const html = document.documentElement;
    const body = document.body;

    body.style.position = lockState.prev.bodyPosition || "";
    body.style.top = lockState.prev.bodyTop || "";
    body.style.width = lockState.prev.bodyWidth || "";
    body.style.overflow = lockState.prev.bodyOverflow || "";
    html.style.overflow = lockState.prev.htmlOverflow || "";
    html.classList.remove(STATE.htmlLocked);

    window.scrollTo(0, lockState.scrollY);

    lockState.locked = false;
  }

  function getFocusable(modal) {
    if (!modal) return [];
    const content = modal.querySelector(SELECTORS.content) || modal;
    const nodes = content.querySelectorAll(
      [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "[tabindex]:not([tabindex='-1'])",
      ].join(",")
    );
    return Array.from(nodes).filter((el) => el.offsetParent !== null);
  }

  function focusFirst(modal) {
    const focusables = getFocusable(modal);
    if (focusables.length) focusables[0].focus();
    else modal.focus?.();
  }

  function trapTab(e, modal) {
    if (e.key !== "Tab") return;
    const focusables = getFocusable(modal);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      if (active === first || active === modal) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function findModalById(id) {
    if (!id) return null;
    return document.querySelector(`${SELECTORS.modal}[data-rs-modal="${cssEscape(id)}"]`);
  }

  function closeModal(modal, reason = "close") {
    if (!modal) return;

    modal.classList.remove(STATE.open);
    modal.setAttribute("aria-hidden", "true");

    if (shouldLock(modal)) unlockScroll();

    const closedModalId = modal.getAttribute("data-rs-modal") || null;
    window.RS.emit("rs:modal:close", { id: closedModalId, modal, reason });

    // return focus
    if (lastTrigger && typeof lastTrigger.focus === "function") {
      lastTrigger.focus();
    }

    if (activeModal === modal) activeModal = null;
    lastTrigger = null;
  }

  function openModal(modal, trigger = null) {
    if (!modal) return;

    // close currently opened modal (single-open policy)
    if (activeModal && activeModal !== modal) {
      closeModal(activeModal, "switch");
    }

    lastTrigger = trigger || null;
    activeModal = modal;

    modal.classList.add(STATE.open);
    modal.setAttribute("aria-hidden", "false");
    modal.setAttribute("tabindex", "-1");

    if (shouldLock(modal)) lockScroll();

    const openedModalId = modal.getAttribute("data-rs-modal") || null;
    window.RS.emit("rs:modal:open", { id: openedModalId, modal, trigger });

    // focus
    setTimeout(() => focusFirst(modal), 0);
  }

  function getOpenTargetFromEl(el) {
    // supports:
    // data-rs-modal-open="signup" (preferred)
    // OR data-rs-modal-target="#modalId" (fallback if you want)
    const id = el.getAttribute("data-rs-modal-open");
    if (id) return { type: "id", value: id };

    const sel = el.getAttribute("data-rs-modal-target");
    if (sel) return { type: "selector", value: sel };

    return null;
  }

  function isFormControl(el) {
    const tag = (el.tagName || "").toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select";
  }

  function resolveModal(target) {
    if (!target) return null;
    if (target.type === "id") return findModalById(target.value);
    if (target.type === "selector") return document.querySelector(target.value);
    return null;
  }

  window.RS.register("modal", function initModal() {
    // CLICK open (delegation)
    document.addEventListener("click", (e) => {
      const openEl = e.target.closest(SELECTORS.open);
      if (openEl) {
        e.preventDefault();

        const target = getOpenTargetFromEl(openEl);
        const modal = resolveModal(target);
        if (modal) openModal(modal, openEl);
        return;
      }

      // close button
      const closeEl = e.target.closest(SELECTORS.close);
      if (closeEl) {
        const modal = closeEl.closest(SELECTORS.modal);
        if (modal) closeModal(modal, "button");
        return;
      }

      // overlay click
      const overlayEl = e.target.closest(SELECTORS.overlay);
      if (overlayEl) {
        const modal = overlayEl.closest(SELECTORS.modal);
        if (!modal) return;

        // if user clicked inside content, ignore
        const content = modal.querySelector(SELECTORS.content);
        if (content && content.contains(e.target)) return;

        closeModal(modal, "overlay");
      }
    });

    // INPUT open on focus (for elements that have data-rs-modal-open and are form controls)
    document.addEventListener("focusin", (e) => {
      const el = e.target;
      if (!el || !el.matches?.(SELECTORS.open)) return;

      // for inputs/selects/textareas open on focus
      if (!isFormControl(el)) return;

      const target = getOpenTargetFromEl(el);
      const modal = resolveModal(target);
      if (modal) openModal(modal, el);
    });

    // ESC + focus trap
    document.addEventListener("keydown", (e) => {
      if (!activeModal) return;

      if (e.key === "Escape") {
        e.preventDefault();
        closeModal(activeModal, "escape");
        return;
      }

      trapTab(e, activeModal);
    });
  });
})();
