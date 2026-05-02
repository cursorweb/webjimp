import { AddStrokeCommand, EraseCommand, type Command } from "./Command";
import { Layer } from "./Layer";
import { Mode } from "./Mode";
import { Stroke } from "./Stroke";

export class DrawingMode extends Mode {
    layers: Layer[] = [new Layer()];
    currentLayer = 0;
    color = color(255, 0, 0);

    private colors = [color(255, 0, 0), color(0, 0, 255)];

    private currentStroke: Stroke | null = null;

    brush: "paint" | "select" | "erase" = "paint";
    eraserSize = 20;
    weight = 4;

    // Undo/redo: two implementation approaches
    // 1. Command pattern (current): each action is a Command object with execute()/undo(). O(1)
    //    memory per step — only stores references to affected strokes, not full copies.
    //    Add new undoable actions by implementing the Command interface in src/commands/.
    private static readonly MAX_HISTORY = 32;

    // increase the undoStack each time a command happens (most recent command)
    // pop the undoStack to undo the command
    undoStack: Command[] = [];
    // redoStack puts it back on the undoStack
    private redoStack: Command[] = [];

    private cursorBtn = document.querySelector<HTMLButtonElement>(".cursor-btn")!;
    private paintBtn = document.querySelector<HTMLButtonElement>(".paint-btn")!;
    private eraserBtn = document.querySelector<HTMLButtonElement>(".eraser-btn")!;
    private undoBtn = document.querySelector<HTMLButtonElement>(".undo-btn")!;
    private redoBtn = document.querySelector<HTMLButtonElement>(".redo-btn")!;
    private layersEl = document.querySelector<HTMLDivElement>(".layers")!;
    private addLayerBtn = document.querySelector<HTMLButtonElement>(".addlayer-btn")!;
    private layerBtns: HTMLButtonElement[] = [];

    private onCursor = () => { this.brush = "select"; this.setActiveBtn(this.cursorBtn); };
    private onPaint = () => { this.brush = "paint"; this.setActiveBtn(this.paintBtn); };
    private onErase = () => { this.brush = "erase"; this.setActiveBtn(this.eraserBtn); };

    constructor() {
        super();
        this.cursorBtn.addEventListener("click", this.onCursor);
        this.paintBtn.addEventListener("click", this.onPaint);
        this.eraserBtn.addEventListener("click", this.onErase);
        this.setActiveBtn(this.paintBtn);

        this.undoBtn.addEventListener("click", () => this.undo());
        this.redoBtn.addEventListener("click", () => this.redo());

        this.addLayerUI(0);
        this.addLayerBtn.addEventListener("click", () => this.addLayer());

        window.addEventListener("keydown", (e) => {
            if (!e.ctrlKey && !e.metaKey) return;
            if (e.key == "z") { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); }
            if (e.key == "y") { e.preventDefault(); this.redo(); }
        });
    }

    private executeCommand(cmd: Command) {
        cmd.execute();
        this.undoStack.push(cmd);
        if (this.undoStack.length > DrawingMode.MAX_HISTORY) this.undoStack.shift();
        this.redoStack = [];
    }

    undo() {
        const cmd = this.undoStack.pop();
        if (!cmd) return;
        cmd.undo();
        this.redoStack.push(cmd);
    }

    redo() {
        const cmd = this.redoStack.pop();
        if (!cmd) return;
        cmd.execute();
        this.undoStack.push(cmd);
    }

    private addLayer() {
        this.layers.push(new Layer());
        this.addLayerUI(this.layers.length - 1);
    }

    private addLayerUI(index: number) {
        const btn = document.createElement("button");
        btn.textContent = `Layer ${index + 1}`;
        btn.addEventListener("click", () => this.setActiveLayer(index));
        this.layersEl.appendChild(btn);
        this.layerBtns.push(btn);
        this.setActiveLayer(index);
    }

    private setActiveLayer(index: number) {
        this.currentLayer = index;
        this.layerBtns.forEach((btn, i) => btn.disabled = i == index);
    }

    private setActiveBtn(active: HTMLButtonElement) {
        for (const btn of [this.cursorBtn, this.paintBtn, this.eraserBtn]) {
            btn.disabled = btn == active;
        }
    }

    draw() {
        for (let i = 0; i < this.layers.length; i++) {
            if (this.brush == "erase" && this.currentStroke && i == this.currentLayer) {
                this.layers[i].previewErase(this.currentStroke);
            } else {
                this.layers[i].draw();
            }

            if (i == this.currentLayer && this.brush != "erase") {
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
        this.currentStroke = new Stroke(this.colors[this.currentLayer], weight);
        this.currentStroke.points.push([mouseX, mouseY]);
    }

    mouseDragged() {
        this.currentStroke?.points.push([mouseX, mouseY]);
    }

    mouseReleased() {
        if (!this.currentStroke) return;

        if (this.brush == "paint") {
            this.executeCommand(new AddStrokeCommand(this.layers[this.currentLayer], this.currentStroke));
        } else if (this.brush == "erase") {
            this.executeCommand(new EraseCommand(this.layers[this.currentLayer], this.currentStroke));
        }

        this.currentStroke = null;
    }
}