import { embed, getSticker } from "./api";
import type { SnipUI } from "./SnipUI";

const MAX_W = 800;
const MAX_H = 600;

/**
 * StickerManager takes in input from SnipUI
 */
export class StickerManager {
    private sourceImage: ImageBitmap | null = null;
    private statusEl = document.querySelector<HTMLSpanElement>(".embed-status")!;
    private potentialSticker: ImageBitmap | null = null;

    private polygonOverlays: [number, number][][] | null = null;

    private scale = 1;

    constructor(private editor: SnipUI) { }

    async loadBlob(blob: Blob) {
        const raw = await createImageBitmap(blob);
        const scale = Math.min(1, MAX_W / raw.width, MAX_H / raw.height);
        const w = Math.round(raw.width * scale);
        const h = Math.round(raw.height * scale);
        const scaled = await createImageBitmap(raw, 0, 0, raw.width, raw.height, { resizeWidth: w, resizeHeight: h });
        raw.close();

        this.sourceImage?.close();
        this.sourceImage = scaled;
        this.scale = scale;

        // todo: log based
        // debug: already embedded once
        // this.statusEl.textContent = "⏳ embedding…";
        // embed(blob)
        //     .then(data => { this.statusEl.textContent = data.success ? "✅ embedded" : `❌ ${data.error}`; })
        //     .catch(err => { this.statusEl.textContent = `❌ ${err.message}`; });

        return [w, h];
    }

    draw() {
        if (this.sourceImage) {
            (drawingContext as CanvasRenderingContext2D).drawImage(this.sourceImage, 0, 0);
        }

        push();
        scale(this.scale);
        if (this.polygonOverlays) {
            fill(0, 0, 255, 0.5 * 255);
            for (const poly of this.polygonOverlays) {
                beginShape();
                for (const [x, y] of poly) {
                    vertex(x, y);
                }
                endShape();
            }
        }
        pop();
    }

    addSticker(): any {
        throw new Error("Method not implemented.");
    }

    async segment() {
        const payload = this.editor.toPayload(this.scale);
        const data = await getSticker(payload);

        if (!data.success) {
            // todo
            return;
        }

        this.polygonOverlays = data.polygons;

        const blob = await (await fetch(data.sticker)).blob();
        this.potentialSticker?.close();
        this.potentialSticker = await createImageBitmap(blob);
    }
}