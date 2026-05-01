import { Layer } from "./Layer";
import { Mode } from "./Mode";
import { Stroke } from "./Stroke";

export class DrawingMode extends Mode {
    layers: Layer[] = [new Layer()];
    currentLayer = 0;
    color = color(255, 0, 0);
    private currentStroke: Stroke | null = null;

    draw() {
        for (const layer of this.layers) {
            layer.draw();
        }
        this.currentStroke?.draw();
    }

    mousePressed() {
        this.currentStroke = new Stroke(this.color);
        this.currentStroke.points.push([mouseX, mouseY]);
    }

    mouseDragged() {
        this.currentStroke?.points.push([mouseX, mouseY]);
    }

    mouseReleased() {
        if (this.currentStroke) {
            this.layers[this.currentLayer].addStroke(this.currentStroke);
            this.currentStroke = null;
        }
    }
}