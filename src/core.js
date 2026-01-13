// src/core.js
(function () {
  const RS = (window.RS = window.RS || {});

  // basic meta
  RS.version = RS.version || "0.1.0";
  RS.modules = RS.modules || {}; // { modal: initFn, ... }

  // debug flag: window.RS_DEBUG = true
  RS.debug = function (...args) {
    if (window.RS_DEBUG) console.log("[RS]", ...args);
  };

  // basic event helper
  RS.emit = function (name, detail = {}) {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  };

  // module registry
  RS.register = function (name, initFn) {
    if (!name || typeof initFn !== "function") return;
    RS.modules[name] = initFn;
    RS.debug("registered:", name);
  };

  // init all registered modules
  RS.init = function () {
    RS.debug("init start");
    Object.entries(RS.modules).forEach(([name, initFn]) => {
      try {
        initFn();
        RS.debug("init ok:", name);
      } catch (e) {
        console.error("[RS] init failed:", name, e);
      }
    });
    RS.debug("init done");
  };

  // NOTE: no auto-run here. Call window.RS.init() manually.
})();
