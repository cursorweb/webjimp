import { AddStrokeCommand } from "../DrawingCommand";
import { Brush } from "./Brush";
import { Stroke } from "../Stroke";
import type { Layer } from "../Layer";
import type { Command } from "../../HistoryManager";

const PALETTE: [number, number, number][] = [
    [0, 0, 0], [255, 255, 255],
    [220, 50, 50], [255, 140, 0], [255, 220, 0],
    [50, 180, 50], [0, 190, 220], [50, 50, 220],
    [140, 50, 220], [220, 50, 150],
];

export class PaintBrush extends Brush {
    private currentStroke: Stroke | null = null;
    private selectedColor!: p5.Color;
    weight = 4;

    private colorBtnsEl = document.querySelector<HTMLDivElement>(".color-btns")!;
    private brushWidthInput = document.querySelector<HTMLInputElement>(".brush-width")!;
    private colorBtns: HTMLButtonElement[] = [];
    private onWidthInput = () => { this.weight = Number(this.brushWidthInput.value); };

    constructor() {
        super();
        for (const [r, g, b] of PALETTE) {
            const btn = document.createElement("button");
            btn.style.background = `rgb(${r},${g},${b})`;
            btn.addEventListener("click", () => this.setSelectedColor(color(r, g, b), btn));
            this.colorBtnsEl.appendChild(btn);
            this.colorBtns.push(btn);
        }
        this.setSelectedColor(color(220, 50, 50), this.colorBtns[2]);
    }

    private setSelectedColor(c: p5.Color, btn: HTMLButtonElement) {
        this.selectedColor = c;
        this.colorBtns.forEach(b => b.disabled = b == btn);
    }

    activate() {
        this.colorBtnsEl.style.display = "";
        this.brushWidthInput.value = String(this.weight);
        this.brushWidthInput.addEventListener("input", this.onWidthInput);
    }

    deactivate() {
        this.colorBtnsEl.style.display = "none";
        this.brushWidthInput.removeEventListener("input", this.onWidthInput);
    }

    onMousePressed() {
        this.currentStroke = new Stroke(this.selectedColor, this.weight);
        this.currentStroke.points.push([mouseX, mouseY]);
    }

    onMouseDragged() {
        this.currentStroke?.points.push([mouseX, mouseY]);
    }

    onMouseReleased(layer: Layer): Command | null {
        if (!this.currentStroke) return null;
        const cmd = new AddStrokeCommand(layer, this.currentStroke);
        this.currentStroke = null;
        return cmd;
    }

    drawLayer(layer: Layer, isActive: boolean) {
        layer.draw();
        if (isActive) this.currentStroke?.draw();
    }

    drawCursor() {
        stroke(255, 128);
        strokeWeight(1);
        noFill();
        circle(mouseX, mouseY, this.weight);
    }
}
