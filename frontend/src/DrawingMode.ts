import { AddStrokeCommand, EraseCommand } from "./Command";
import { HistoryManager } from "./HistoryManager";
import { LayerManager } from "./LayerManager";
import { Mode } from "./Mode";
import { Stroke } from "./Stroke";

export class DrawingMode extends Mode {
    private history = new HistoryManager();
    private layerManager = new LayerManager();
    color = color(255, 0, 0);

    private colors = [color(255, 0, 0), color(0, 0, 255)];

    private currentStroke: Stroke | null = null;

    brush: "paint" | "select" | "erase" = "paint";
    eraserSize = 20;
    weight = 4;

    private cursorBtn = document.querySelector<HTMLButtonElement>(".cursor-btn")!;
    private paintBtn = document.querySelector<HTMLButtonElement>(".paint-btn")!;
    private eraserBtn = document.querySelector<HTMLButtonElement>(".eraser-btn")!;
    private undoBtn = document.querySelector<HTMLButtonElement>(".undo-btn")!;
    private redoBtn = document.querySelector<HTMLButtonElement>(".redo-btn")!;

    private onCursor = () => { this.brush = "select"; this.setActiveBtn(this.cursorBtn); };
    private onPaint = () => { this.brush = "paint"; this.setActiveBtn(this.paintBtn); };
    private onErase = () => { this.brush = "erase"; this.setActiveBtn(this.eraserBtn); };

    constructor() {
        super();
        this.cursorBtn.addEventListener("click", this.onCursor);
        this.paintBtn.addEventListener("click", this.onPaint);
        this.eraserBtn.addEventListener("click", this.onErase);
        this.setActiveBtn(this.paintBtn);

        this.undoBtn.addEventListener("click", () => this.history.undo());
        this.redoBtn.addEventListener("click", () => this.history.redo());
    }

    private setActiveBtn(active: HTMLButtonElement) {
        for (const btn of [this.cursorBtn, this.paintBtn, this.eraserBtn]) {
            btn.disabled = btn == active;
        }
    }

    draw() {
        const { layers, activeLayer } = this.layerManager;

        for (let i = 0; i < layers.length; i++) {
            if (this.brush == "erase" && this.currentStroke && i == activeLayer) {
                layers[i].previewErase(this.currentStroke);
            } else {
                layers[i].draw();
            }

            if (i == activeLayer && this.brush != "erase") {
                this.currentStroke?.draw();
            }
        }

        stroke(255, 128);
        strokeWeight(1);
        noFill();

        circle(mouseX, mouseY, this.brush == "erase" ? this.eraserSize : this.weight);
    }

    mousePressed() {
        const weight = this.brush == "erase" ? this.eraserSize : this.weight;
        this.currentStroke = new Stroke(this.colors[this.layerManager.activeLayer], weight);
        this.currentStroke.points.push([mouseX, mouseY]);
    }

    mouseDragged() {
        this.currentStroke?.points.push([mouseX, mouseY]);
    }

    mouseReleased() {
        if (!this.currentStroke) return;

        const layer = this.layerManager.getActiveLayer();
        if (this.brush == "paint") {
            this.history.executeCommand(new AddStrokeCommand(layer, this.currentStroke));
        } else if (this.brush == "erase") {
            this.history.executeCommand(new EraseCommand(layer, this.currentStroke));
        }

        this.currentStroke = null;
    }
}
