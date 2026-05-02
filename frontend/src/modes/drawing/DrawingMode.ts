import { Brush } from "./brush/Brush";
import { EraserBrush } from "./brush/EraserBrush";
import { HistoryManager } from "./HistoryManager";
import { LayerManager } from "./LayerManager";
import { Mode } from "../Mode";
import { PaintBrush } from "./brush/PaintBrush";
import { SelectBrush } from "./brush/SelectBrush";

export class DrawingMode extends Mode {
    private history = new HistoryManager();
    private layerManager = new LayerManager();

    private paintBrush = new PaintBrush();
    private eraserBrush = new EraserBrush();
    private selectBrush = new SelectBrush();
    private activeBrush!: Brush;

    private cursorBtn = document.querySelector<HTMLButtonElement>(".cursor-btn")!;
    private paintBtn = document.querySelector<HTMLButtonElement>(".paint-btn")!;
    private eraserBtn = document.querySelector<HTMLButtonElement>(".eraser-btn")!;

    constructor() {
        super();
        this.activeBrush = this.paintBrush;
        this.paintBrush.activate();

        this.cursorBtn.addEventListener("click", () => this.setActiveBrush(this.selectBrush, this.cursorBtn));
        this.paintBtn.addEventListener("click", () => this.setActiveBrush(this.paintBrush, this.paintBtn));
        this.eraserBtn.addEventListener("click", () => this.setActiveBrush(this.eraserBrush, this.eraserBtn));
        this.setActiveBrush(this.paintBrush, this.paintBtn);
    }

    private setActiveBrush(brush: Brush, btn: HTMLButtonElement) {
        if (this.activeBrush != brush) {
            this.activeBrush.deactivate();
            this.activeBrush = brush;
            brush.activate();
        }

        for (const b of [this.cursorBtn, this.paintBtn, this.eraserBtn]) {
            b.disabled = b == btn;
        }
    }

    draw() {
        const { layers, activeLayer } = this.layerManager;
        for (let i = 0; i < layers.length; i++) {
            this.activeBrush.drawLayer(layers[i], i == activeLayer);
        }
        this.activeBrush.drawCursor();
    }

    mousePressed() { this.activeBrush.onMousePressed(); }
    mouseDragged() { this.activeBrush.onMouseDragged(); }

    mouseReleased() {
        const cmd = this.activeBrush.onMouseReleased(this.layerManager.getActiveLayer());
        if (cmd) this.history.executeCommand(cmd);
    }

    onUndo() {
        this.activeBrush.resetState();
        this.history.undo();
    }

    onRedo() {
        this.activeBrush.resetState();
        this.history.redo();
    }
}
