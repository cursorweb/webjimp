import { Sticker } from "./Sticker";

const HANDLE_OFFSET = 30;
const HANDLE_RADIUS = 8;

export class StickerHandle {
    private dragMode: "body" | "rotate" | null = null;

    constructor(private sticker: Sticker) { }

    // Transforms world point into sticker local space to check body and rotation handle
    hitTest(x: number, y: number): "body" | "rotate" | null {
        const s = this.sticker;
        const cx = s.x + s.width / 2;
        const cy = s.y + s.height / 2;
        const cos = Math.cos(-s.rotation);
        const sin = Math.sin(-s.rotation);
        const lx = cos * (x - cx) - sin * (y - cy);
        const ly = sin * (x - cx) + cos * (y - cy);

        const hdy = ly - (-s.height / 2 - HANDLE_OFFSET);
        if (lx * lx + hdy * hdy <= HANDLE_RADIUS * HANDLE_RADIUS) return "rotate";

        if (lx >= -s.width / 2 && lx <= s.width / 2 && ly >= -s.height / 2 && ly <= s.height / 2) return "body";

        return null;
    }

    startDrag(x: number, y: number): void {
        this.dragMode = this.hitTest(x, y);
    }

    onDrag(x: number, y: number, dx: number, dy: number): void {
        if (this.dragMode === "body") {
            this.sticker.move(dx, dy);
        } else if (this.dragMode === "rotate") {
            const cx = this.sticker.x + this.sticker.width / 2;
            const cy = this.sticker.y + this.sticker.height / 2;
            this.sticker.rotate(Math.atan2(y - cy, x - cx) + Math.PI / 2);
        }
    }

    drawHandle(): void {
        const s = this.sticker;
        push();
        translate(s.x + s.width / 2, s.y + s.height / 2);
        rotate(s.rotation);

        stroke(255);
        strokeWeight(1);
        noFill();
        rect(-s.width / 2, -s.height / 2, s.width, s.height);

        fill(255);
        stroke(255);
        circle(0, -s.height / 2 - HANDLE_OFFSET, HANDLE_RADIUS * 2);

        pop();
    }
}