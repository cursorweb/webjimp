import type { Sticker } from "./Sticker";
import type { Stroke } from "./Stroke";

export class Layer {
    constructor(public stickers: Sticker[], public strokes: Stroke[]) { }
}