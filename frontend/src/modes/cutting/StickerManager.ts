import { getSticker } from "./api";
import type { StickerLibrary } from "../StickerLibrary";
import type { SnipUI } from "./SnipUI";

const MAX_W = 800;
const MAX_H = 600;

export class StickerManager {
    private sourceImage: ImageBitmap | null = null;

    /** Segmented sticker, pending acceptance */
    private sticker: ImageBitmap | null = null;
    private stickerURL: string | null = null;
    private polygonOverlays: [number, number][][] | null = null;

    private scale = 1;

    constructor(private editor: SnipUI, private library: StickerLibrary) { }

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

        return [w, h];
    }

    draw() {
        if (this.sourceImage) {
            (drawingContext as CanvasRenderingContext2D).drawImage(this.sourceImage, 0, 0);
        }

        if (this.polygonOverlays) {
            push();
            scale(this.scale);
            noStroke();
            fill(0, 0, 255, 0.5 * 255);
            for (const poly of this.polygonOverlays) {
                beginShape();
                for (const [x, y] of poly) {
                    vertex(x, y);
                }
                endShape();
            }
            pop();
        }
    }

    addSticker(): void {
        if (!this.sticker || !this.stickerURL) return;
        this.library.add(this.stickerURL, this.sticker);

        // prevent accidentally double closing (ownership!)
        this.sticker = null;
        this.stickerURL = null;
    }

    async segment() {
        const payload = this.editor.toPayload(this.scale);
        const data = await getSticker(payload);

        if (!data.success) {
            // todo
            return;
        }

        this.polygonOverlays = data.polygons;
        this.stickerURL = data.sticker;

        const blob = await (await fetch(data.sticker)).blob();
        this.sticker?.close();
        this.sticker = await createImageBitmap(blob);
    }
}
