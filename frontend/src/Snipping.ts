import { getStickerBlur } from "./api";

export interface ClickPoint {
    x: number;
    y: number;
    foreground: boolean;
}

export class BoundingBox {
    constructor(
        public x1: number,
        public y1: number,
        public x2: number,
        public y2: number,
    ) { }

    draw(scale: number) {
        noFill();
        strokeWeight(2);
        stroke(123, 34, 39);
        rect(this.x1 * scale, this.y1 * scale, (this.x2 - this.x1) * scale, (this.y2 - this.y1) * scale);
    }
}

export class Snip {
    public box: BoundingBox | null = null;
    public points: ClickPoint[] = [];

    get hasSelections(): boolean {
        return this.box !== null;
    }

    addMask(mask: BoundingBox) {
        this.box = mask;
    }

    draw(scale: number) {
        this.box?.draw(scale);
        // TODO: draw points
    }

    /**
     * Segments each mask independently, returning the final composited background bitmap.
     * Each mask's result becomes the input for the next (applied in order).
     */
    async segment(currentWidth: number, currentHeight: number): Promise<ImageBitmap> {
        let bgDataUrl: string | null = null;

        const data = await getStickerBlur(this);
        if (!data.success) throw new Error(data.error ?? "Segment failed");
        bgDataUrl = data.background;

        if (!bgDataUrl) throw new Error("No box to segment");

        const bgBlob = await fetch(bgDataUrl).then((r) => r.blob());
        return createImageBitmap(bgBlob, { resizeWidth: currentWidth, resizeHeight: currentHeight });
    }

    clear() {
        this.box = null;
        this.points = [];
    }
}