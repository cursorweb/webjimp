import { AddStrokeCommand, EraseCommand, MoveCommand } from "./Command";
import { HistoryManager } from "./HistoryManager";
import { LayerManager } from "./LayerManager";
import { Mode } from "../Mode";
import { SelectionManager } from "./SelectionManager";
import { Stroke } from "./Stroke";

export class DrawingMode extends Mode {
    private history = new HistoryManager();
    private layerManager = new LayerManager();
    private selection = new SelectionManager();
    color = color(255, 0, 0);

    private colors = [color(255, 0, 0), color(0, 0, 255)];

    private currentStroke: Stroke | null = null;

    brush: "paint" | "select" | "erase" = "paint";
    eraserSize = 20;
    weight = 4;

    private cursorBtn = document.querySelector<HTMLButtonElement>(".cursor-btn")!;
    private paintBtn = document.querySelector<HTMLButtonElement>(".paint-btn")!;
    private eraserBtn = document.querySelector<HTMLButtonElement>(".eraser-btn")!;

    private onCursor = () => { this.brush = "select"; this.setActiveBtn(this.cursorBtn); };
    private onPaint = () => { this.selection.deselect(); this.brush = "paint"; this.setActiveBtn(this.paintBtn); };
    private onErase = () => { this.selection.deselect(); this.brush = "erase"; this.setActiveBtn(this.eraserBtn); };

    constructor() {
        super();
        this.cursorBtn.addEventListener("click", this.onCursor);
        this.paintBtn.addEventListener("click", this.onPaint);
        this.eraserBtn.addEventListener("click", this.onErase);
        this.setActiveBtn(this.paintBtn);
    }

    private setActiveBtn(active: HTMLButtonElement) {
        for (const btn of [this.cursorBtn, this.paintBtn, this.eraserBtn]) {
            btn.disabled = btn == active;
        }
    }

    draw() {
        const { layers, activeLayer } = this.layerManager;
        const selectedSet = this.brush == "select" ? this.selection.selectedSet : null;

        for (let i = 0; i < layers.length; i++) {
            if (this.brush == "erase" && this.currentStroke && i == activeLayer) {
                layers[i].previewErase(this.currentStroke);
            } else if (selectedSet && i == activeLayer) {
                layers[i].previewOffset(selectedSet, this.selection.offsetX, this.selection.offsetY);
            } else {
                layers[i].draw();
            }

            if (i == activeLayer && this.brush != "erase") {
                this.currentStroke?.draw();
            }
        }

        if (this.brush == "select") this.selection.draw();

        if (this.brush != "select") {
            noCursor();
            stroke(255, 128);
            strokeWeight(1);
            noFill();

            circle(mouseX, mouseY, this.brush == "erase" ? this.eraserSize : this.weight);
        } else {
            cursor(ARROW);
        }
    }

    mousePressed() {
        if (this.brush == "select") {
            if (this.selection.hasSelection && this.selection.isInsideBox(mouseX, mouseY)) {
                this.selection.startDrag(mouseX, mouseY);
            } else {
                this.selection.deselect();
                this.selection.startSelect(mouseX, mouseY);
            }
            return;
        }

        // erase or paint
        const weight = this.brush == "erase" ? this.eraserSize : this.weight;
        this.currentStroke = new Stroke(this.colors[this.layerManager.activeLayer], weight);
        this.currentStroke.points.push([mouseX, mouseY]);
    }

    mouseDragged() {
        if (this.brush == "select") {
            if (this.selection.state == "dragging") {
                this.selection.updateDrag(mouseX, mouseY);
            } else {
                this.selection.updateSelect(mouseX, mouseY);
            }
            return;
        }
        this.currentStroke?.points.push([mouseX, mouseY]);
    }

    mouseReleased() {
        if (this.brush == "select") {
            if (this.selection.state == "dragging") {
                const { dx, dy } = this.selection.commitDrag();
                if (dx != 0 || dy != 0) {
                    this.history.executeCommand(new MoveCommand(this.selection.selectedStrokes, dx, dy));
                }
            } else {
                // finished selecting
                this.selection.finalize(this.layerManager.getActiveLayer());
            }
            return;
        }

        if (!this.currentStroke) return;
        const layer = this.layerManager.getActiveLayer();
        if (this.brush == "paint") {
            this.history.executeCommand(new AddStrokeCommand(layer, this.currentStroke));
        } else if (this.brush == "erase") {
            this.history.executeCommand(new EraseCommand(layer, this.currentStroke));
        }
        this.currentStroke = null;
    }

    onUndo() { this.selection.deselect(); this.history.undo(); }
    onRedo() { this.selection.deselect(); this.history.redo(); }
}
