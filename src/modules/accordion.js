// src/modules/accordion.js
(function () {
  if (!window.RS || !window.RS.register) {
    console.warn("[RS] core is missing. Include rs-core.min.js first.");
    return;
  }

  const SEL = {
    item: "[data-rs-accordion-item]",
    head: "[data-rs-accordion-head]",
    panel: "[data-rs-accordion-panel]",
  };

  function getOffset(item) {
    const raw =
      item.getAttribute("data-rs-accordion-offset") ||
      item.closest("[data-rs-accordion-offset]")?.getAttribute("data-rs-accordion-offset") ||
      "0";

    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  }

  function getTriggerMode(item) {
    // "item" (default) або "head"
    return (
      item.getAttribute("data-rs-accordion-trigger") ||
      item.closest("[data-rs-accordion-trigger]")?.getAttribute("data-rs-accordion-trigger") ||
      "item"
    );
  }

  function setPanelHeight(item) {
    const panel = item.querySelector(SEL.panel);
    if (!panel) return;

    const offset = getOffset(item);
    panel.style.maxHeight = panel.scrollHeight + offset + "px";
  }

  function closeItem(item) {
    const head = item.querySelector(SEL.head);
    const panel = item.querySelector(SEL.panel);
    if (!panel) return;

    item.classList.remove("is-open");
    head?.classList.remove("is-open");
    panel.classList.remove("is-open");

    panel.style.maxHeight = "0px";

    window.RS.emit?.("rs:accordion:close", { item });
  }

  function openItem(item) {
    const head = item.querySelector(SEL.head);
    const panel = item.querySelector(SEL.panel);
    if (!panel) return;

    item.classList.add("is-open");
    head?.classList.add("is-open");
    panel.classList.add("is-open");

    setPanelHeight(item);

    window.RS.emit?.("rs:accordion:open", { item });
  }

  function toggleItem(item) {
    if (item.classList.contains("is-open")) {
      closeItem(item);
      return;
    }

    const group = item.getAttribute("data-rs-accordion-group");
    if (group) {
      // закриваємо інші відкриті в групі
      document
        .querySelectorAll(
          `${SEL.item}[data-rs-accordion-group="${CSS.escape(group)}"].is-open`
        )
        .forEach((el) => {
          if (el !== item) closeItem(el);
        });
    }

    openItem(item);
  }

  function initDefaults() {
    document.querySelectorAll(SEL.item).forEach((item) => {
      const openAttr = item.getAttribute("data-rs-accordion-open");
      const shouldOpen = item.classList.contains("is-open") || openAttr === "true";

      const head = item.querySelector(SEL.head);
      const panel = item.querySelector(SEL.panel);
      if (!panel) return;

      if (shouldOpen) {
        item.classList.add("is-open");
        head?.classList.add("is-open");
        panel.classList.add("is-open");
        setPanelHeight(item);
      } else {
        panel.style.maxHeight = "0px";
      }
    });
  }

  function bindEvents() {
    const INTERACTIVE = "a,button,input,textarea,select,label";

    // click
    document.addEventListener("click", (e) => {
      const item = e.target.closest(SEL.item);
      if (!item) return;

      const mode = getTriggerMode(item);

      // Mode: head only
      if (mode === "head") {
        const head = e.target.closest(SEL.head);
        if (!head || !item.contains(head)) return;

        toggleItem(item);
        return;
      }

      // Mode: item (default)
      // 1) не тогглимо кліки в panel
      if (e.target.closest(SEL.panel)) return;

      // 2) можна вручну вимкнути toggle на окремих елементах
      if (e.target.closest("[data-rs-accordion-ignore]")) return;

      // 3) не тогглимо інтерактивні елементи, якщо вони не в head
      const interactiveEl = e.target.closest(INTERACTIVE);
      if (interactiveEl && !interactiveEl.closest(SEL.head)) return;

      toggleItem(item);
    });

    // keyboard: працює через head
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;

      const head = e.target.closest?.(SEL.head);
      if (!head) return;

      // prevent page scroll on Space
      e.preventDefault();

      const item = head.closest(SEL.item);
      if (!item) return;

      toggleItem(item);
    });

    // resize: перерахувати висоту для відкритих
    window.addEventListener("resize", () => {
      document.querySelectorAll(`${SEL.item}.is-open`).forEach(setPanelHeight);
    });
  }

  window.RS.register("accordion", function initAccordion() {
    initDefaults();
    bindEvents();
    window.RS.debug?.("accordion ready");
  });
})();
