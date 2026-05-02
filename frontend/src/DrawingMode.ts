import { Layer } from "./Layer";
import { Mode } from "./Mode";
import { Stroke } from "./Stroke";

export class DrawingMode extends Mode {
    layers: Layer[] = [new Layer()];
    currentLayer = 0;
    color = color(255, 0, 0);
    private currentStroke: Stroke | null = null;

    brush: "paint" | "select" | "erase" = "paint";
    eraserSize = 20;
    weight = 4;

    private cursorBtn = document.querySelector<HTMLButtonElement>(".cursor-btn")!;
    private paintBtn = document.querySelector<HTMLButtonElement>(".paint-btn")!;
    private eraserBtn = document.querySelector<HTMLButtonElement>(".eraser-btn")!;

    private onCursor = () => { this.brush = "select"; };
    private onPaint = () => { this.brush = "paint"; };
    private onErase = () => { this.brush = "erase"; };

    constructor() {
        super();
        this.cursorBtn.addEventListener("click", this.onCursor);
        this.paintBtn.addEventListener("click", this.onPaint);
        this.eraserBtn.addEventListener("click", this.onErase);
    }

    cleanup() {
        this.cursorBtn.removeEventListener("click", this.onCursor);
        this.paintBtn.removeEventListener("click", this.onPaint);
        this.eraserBtn.removeEventListener("click", this.onErase);
    }

    draw() {
        for (let i = 0; i < this.layers.length; i++) {
            if (this.brush === "erase" && this.currentStroke && i === this.currentLayer) {
                this.layers[i].previewErase(this.currentStroke);
            } else {
                this.layers[i].draw();
            }
        }

        if (this.brush !== "erase") {
            this.currentStroke?.draw();
        }

        stroke(255, 128);
        strokeWeight(1);
        noFill();

        circle(mouseX, mouseY, this.brush == "erase" ? this.eraserSize : this.weight);
    }

    mousePressed() {
        const weight = this.brush == "erase" ? this.eraserSize : this.weight;
        this.currentStroke = new Stroke(this.color, weight);
        this.currentStroke.points.push([mouseX, mouseY]);
    }

    mouseDragged() {
        this.currentStroke?.points.push([mouseX, mouseY]);
    }

    mouseReleased() {
        if (!this.currentStroke) return;

        if (this.brush == "paint") {
            this.layers[this.currentLayer].addStroke(this.currentStroke);
        } else if (this.brush == "erase") {
            this.layers[this.currentLayer].eraseStroke(this.currentStroke);
        }

        this.currentStroke = null;
    }
}