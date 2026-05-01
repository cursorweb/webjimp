import type { Sticker } from "./Sticker";
import type { Stroke } from "./Stroke";

export class Layer {
    stickers: Sticker[] = [];
    strokes: Stroke[] = [];

    draw() {
        for (const sticker of this.stickers) {
            sticker.draw();
        }

        for (const stroke of this.strokes) {
            stroke.draw();
        }
    }

    addStroke(stroke: Stroke) {
        this.strokes.push(stroke);
    }
}