import { CuttingMode } from "./CuttingMode";
import { DrawingMode } from "./DrawingMode";
import type { Mode } from "./Mode";
import type { Sticker } from "./Sticker";

export class AppState {
    drawingMode = new DrawingMode();
    cuttingMode = new CuttingMode(s => this.stickers.push(s));
    stickers: Sticker[] = [];

    active: Mode = this.drawingMode;

    private tabs = document.querySelectorAll<HTMLButtonElement>(".tabs button");

    constructor() {
        this.tabs[0].addEventListener("click", () => this.setActive(this.drawingMode, 0));
        this.tabs[1].addEventListener("click", () => this.setActive(this.cuttingMode, 1));
        this.setActive(this.drawingMode, 0);
    }

    private setActive(mode: Mode, tabIndex: number) {
        this.active = mode;
        this.tabs.forEach((btn, i) => btn.disabled = i == tabIndex);

        const isDrawing = mode === this.drawingMode;
        document.querySelectorAll<HTMLElement>(".draw-mode")
            .forEach(el => el.style.display = isDrawing ? "" : "none");
        document.querySelectorAll<HTMLElement>(".snip-mode")
            .forEach(el => el.style.display = isDrawing ? "none" : "");
    }
}
