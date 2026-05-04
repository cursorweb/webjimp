import { EraseCommand } from "../DrawingCommand";
import { Brush } from "./Brush";
import { Stroke } from "../Stroke";
import type { Layer } from "../Layer";
import type { Command } from "../../HistoryManager";

export class EraserBrush extends Brush {
    private currentStroke: Stroke | null = null;
    weight = 20;

    private brushWidthInput = document.querySelector<HTMLInputElement>(".brush-width")!;
    private onWidthInput = () => { this.weight = Number(this.brushWidthInput.value); };

    activate() {
        this.brushWidthInput.value = String(this.weight);
        this.brushWidthInput.addEventListener("input", this.onWidthInput);
    }

    deactivate() {
        this.brushWidthInput.removeEventListener("input", this.onWidthInput);
    }

    onMousePressed() {
        this.currentStroke = new Stroke(color(0), this.weight);
        this.currentStroke.points.push([mouseX, mouseY]);
    }

    onMouseDragged() {
        this.currentStroke?.points.push([mouseX, mouseY]);
    }

    onMouseReleased(layer: Layer): Command | null {
        if (!this.currentStroke) return null;
        const cmd = new EraseCommand(layer, this.currentStroke);
        this.currentStroke = null;
        return cmd;
    }

    drawLayer(layer: Layer, isActive: boolean) {
        if (isActive && this.currentStroke) {
            layer.previewErase(this.currentStroke);
        } else {
            layer.draw();
        }
    }

    drawCursor() {
        stroke(255, 128);
        strokeWeight(1);
        noFill();
        circle(mouseX, mouseY, this.weight);
    }
}
