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

    previewErase(eraser: Stroke) {
        for (const sticker of this.stickers) sticker.draw();
        for (const stroke of this.strokes) {
            if (!this.hitsStroke(eraser, stroke)) stroke.draw();
        }
    }

    eraseStroke(eraser: Stroke) {
        this.strokes = this.strokes.filter(stroke => !this.hitsStroke(eraser, stroke));
    }

    private hitsStroke(eraser: Stroke, stroke: Stroke): boolean {
        const r = eraser.weight / 2;
        return stroke.points.some(([px, py]) => this.distToPath(px, py, eraser.points) <= r)
            || eraser.points.some(([px, py]) => this.distToPath(px, py, stroke.points) <= r);
    }

    private distToPath(px: number, py: number, path: [number, number][]): number {
        if (path.length === 1) {
            const [ex, ey] = path[0];
            return Math.hypot(px - ex, py - ey);
        }
        let min = Infinity;
        for (let i = 0; i < path.length - 1; i++) {
            const [ax, ay] = path[i], [bx, by] = path[i + 1];
            const dx = bx - ax, dy = by - ay;
            const lenSq = dx * dx + dy * dy;
            const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
            min = Math.min(min, Math.hypot(px - (ax + t * dx), py - (ay + t * dy)));
        }
        return min;
    }
}
