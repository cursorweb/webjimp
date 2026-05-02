import { CuttingMode } from "./modes/cutting/CuttingMode";
import { DrawingMode } from "./modes/drawing/DrawingMode";
import type { Mode } from "./modes/Mode";
import type { Sticker } from "./Sticker";

export class AppState {
    drawingMode = new DrawingMode();
    cuttingMode = new CuttingMode(s => this.stickers.push(s));
    stickers: Sticker[] = [];

    active: Mode = this.drawingMode;

    private tabs = document.querySelectorAll<HTMLButtonElement>(".tabs button");

    private undoBtn = document.querySelector<HTMLButtonElement>(".undo-btn")!;
    private redoBtn = document.querySelector<HTMLButtonElement>(".redo-btn")!;

    constructor() {
        this.tabs[0].addEventListener("click", () => this.setActive(this.drawingMode, 0));
        this.tabs[1].addEventListener("click", () => this.setActive(this.cuttingMode, 1));
        this.setActive(this.drawingMode, 0);

        window.addEventListener("keydown", (e) => {
            if (!e.ctrlKey && !e.metaKey) return;
            if (e.key == "z" || e.key == "Z") { e.preventDefault(); e.shiftKey ? this.active.onRedo() : this.active.onUndo(); }
            if (e.key == "y" || e.key == "Y") { e.preventDefault(); this.active.onRedo(); }
        });

        this.undoBtn.addEventListener("click", () => this.active.onUndo());
        this.redoBtn.addEventListener("click", () => this.active.onRedo());
    }

    private setActive(mode: Mode, tabIndex: number) {
        this.active = mode;
        this.tabs.forEach((btn, i) => btn.disabled = i == tabIndex);

        const isDrawing = mode == this.drawingMode;
        document.querySelectorAll<HTMLElement>(".draw-mode")
            .forEach(el => el.style.display = isDrawing ? "" : "none");
        document.querySelectorAll<HTMLElement>(".snip-mode")
            .forEach(el => el.style.display = isDrawing ? "none" : "");
    }
}
