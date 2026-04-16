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

    setMask(mask: BoundingBox) {
        this.box = mask;
    }

    draw(scale: number) {
        this.box?.draw(scale);
        // TODO: draw points
    }

    /**
     * Return ImageBitmap result
     */
    async segment(currentWidth: number, currentHeight: number): Promise<{ bg: ImageBitmap, sticker: ImageBitmap }> {
        const data = await getStickerBlur(this);
        if (!data.success) throw new Error(data.error ?? "Segment failed");
        const bgUrl = data.background;
        const stickerUrl = data.sticker;

        // fetch in parallel
        const [bgBlob, stickerBlob] = await Promise.all([
            fetch(bgUrl).then(r => r.blob()),
            fetch(stickerUrl).then(r => r.blob())
        ]);

        const [bg, sticker] = await Promise.all([
            createImageBitmap(bgBlob, {
                resizeWidth: currentWidth,
                resizeHeight: currentHeight
            }),
            createImageBitmap(stickerBlob)
        ]);

        return { bg, sticker };
    }

    clear() {
        this.box = null;
        this.points = [];
    }
}