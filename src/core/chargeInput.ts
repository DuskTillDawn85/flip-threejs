type ChargeInputOptions = {
  domElement: HTMLElement;
  ignoreSelectors?: string[];
  canStart?: () => boolean;
  onBegin: () => void;
  onEnd: (durationMs: number) => void;
  onCancel: () => void;
};

export default class ChargeInput {
  constructor(options: ChargeInputOptions) {
    this.domElement = options.domElement;
    this.ignoreSelectors = options.ignoreSelectors ?? [];
    this.canStart = options.canStart ?? (() => true);
    this.onBegin = options.onBegin;
    this.onEnd = options.onEnd;
    this.onCancel = options.onCancel;
    this.bind();
  }

  private domElement: HTMLElement;
  private ignoreSelectors: string[];
  private canStart: () => boolean;
  private onBegin: () => void;
  private onEnd: (durationMs: number) => void;
  private onCancel: () => void;

  private activePointerId: number | null = null;
  private isCharging = false;
  private startMs = 0;

  reset = () => {
    this.activePointerId = null;
    if (this.isCharging) {
      this.isCharging = false;
      this.startMs = 0;
      this.onCancel();
    }
  };

  private targetIsIgnored = (target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    if (!el) return false;
    return this.ignoreSelectors.some(sel => !!el.closest(sel));
  };

  private begin = () => {
    if (this.isCharging) return;
    if (!this.canStart()) return;
    this.isCharging = true;
    this.startMs = performance.now();
    this.onBegin();
  };

  private end = () => {
    if (!this.isCharging) return;
    const durationMs = performance.now() - this.startMs;
    this.isCharging = false;
    this.startMs = 0;
    this.onEnd(durationMs);
  };

  private cancel = () => {
    if (!this.isCharging) return;
    this.isCharging = false;
    this.startMs = 0;
    this.onCancel();
  };

  private keydownHandler = (e: KeyboardEvent) => {
    if (e.key === " ") {
      e.preventDefault();
    }
    if (e.key !== " ") return;
    if (e.repeat) return;
    if (!this.canStart()) return;
    this.begin();
  };

  private keyupHandler = (e: KeyboardEvent) => {
    if (e.key === " ") {
      e.preventDefault();
    }
    if (e.key !== " ") return;
    this.end();
  };

  private pointerdownHandler = (e: PointerEvent) => {
    if (this.targetIsIgnored(e.target)) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (this.activePointerId !== null) return;
    if (!this.canStart()) return;

    e.preventDefault();
    this.activePointerId = e.pointerId;
    this.domElement.setPointerCapture(e.pointerId);
    this.begin();
  };

  private pointerupHandler = (e: PointerEvent) => {
    if (this.activePointerId !== e.pointerId) return;
    e.preventDefault();
    this.activePointerId = null;
    this.end();
  };

  private pointercancelHandler = (e: PointerEvent) => {
    if (this.activePointerId !== e.pointerId) return;
    e.preventDefault();
    this.activePointerId = null;
    this.cancel();
  };

  private blurHandler = () => {
    this.activePointerId = null;
    this.cancel();
  };

  private bind = () => {
    document.body.addEventListener("keydown", this.keydownHandler);
    document.body.addEventListener("keyup", this.keyupHandler);
    this.domElement.addEventListener("pointerdown", this.pointerdownHandler);
    this.domElement.addEventListener("pointerup", this.pointerupHandler);
    this.domElement.addEventListener("pointercancel", this.pointercancelHandler);
    this.domElement.addEventListener("lostpointercapture", this.pointercancelHandler);
    window.addEventListener("blur", this.blurHandler);
  };
}

