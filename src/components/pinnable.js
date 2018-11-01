AFRAME.registerComponent("pinnable", {
  schema: {
    pinned: { default: false }
  },

  init() {
    this._apply = this._apply.bind(this);
    this._fireEvents = this._fireEvents.bind(this);
    this._firePinnedEvents = this._firePinnedEvents.bind(this);
    this._fireUnpinnedEvents = this._fireUnpinnedEvents.bind(this);
    this._allowApplyOnceComponentsReady = this._allowApplyOnceComponentsReady.bind(this);
    this._allowApply = false;

    this.el.sceneEl.addEventListener("stateadded", this._apply);
    this.el.sceneEl.addEventListener("stateremoved", this._apply);

    // Fire pinned events when we drag and drop or scale in freeze mode,
    // so transform gets updated.
    this.el.addEventListener("grab-end", this._firePinnedEvents);

    // Fire pinned events when page changes so we can persist the page.
    this.el.addEventListener("pager-page-changed", this._firePinnedEvents);

    // Hack: need to wait for the initial grabbable and stretchable components
    // to show up from the template before applying.
    this.el.addEventListener("componentinitialized", this._allowApplyOnceComponentsReady);
    this._allowApplyOnceComponentsReady();
  },

  remove() {
    this.el.sceneEl.removeEventListener("stateadded", this._apply);
    this.el.sceneEl.removeEventListener("stateremoved", this._apply);
    this.el.removeEventListener("componentinitialized", this._allowApplyOnceComponentsReady);
  },

  update() {
    this._apply();
    this._fireEvents();
  },

  _fireEvents() {
    this._firePinnedEvents();
    this._fireUnpinnedEvents();
  },

  _firePinnedEvents() {
    if (this.data.pinned) {
      this.el.emit("pinned");
      this.el.sceneEl.emit("object_pinned", { el: this.el });
    }
  },

  _fireUnpinnedEvents() {
    if (!this.data.pinned) {
      this.el.emit("unpinned");
      this.el.sceneEl.emit("object_unpinned", { el: this.el });
    }
  },

  _allowApplyOnceComponentsReady() {
    if (!this._allowApply && this.el.components.grabbable && this.el.components.stretchable) {
      if (this.el.components.grabbable.data.maxGrabbers !== 0) {
        this.prevMaxGrabbers = this.el.components.grabbable.data.maxGrabbers;
      }

      this._allowApply = true;
      this._apply();
    }
  },

  _apply() {
    if (!this._allowApply) return;
    const isFrozen = this.el.sceneEl.is("frozen");

    if (this.data.pinned && !isFrozen) {
      if (this.el.components.stretchable) {
        this.el.removeAttribute("stretchable");
      }

      this.el.setAttribute("body", { type: "static" });
      this.el.setAttribute("grabbable", { maxGrabbers: 0 });
    } else {
      this.el.setAttribute("grabbable", { maxGrabbers: this.prevMaxGrabbers });

      if (!this.el.components.stretchable) {
        this.el.setAttribute("stretchable", "");
      }
    }
  }
});