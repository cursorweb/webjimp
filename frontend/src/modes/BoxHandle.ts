export type HandleId = "tl" | "tr" | "bl" | "br";

export const HANDLE_R = 8;

/** Axis-aligned box with 4 corner handles. Stateless — construct on demand from current geometry. */
export class BoxHandle {
    constructor(public x: number, public y: number, public w: number, public h: number) { }

    contains(mx: number, my: number): boolean {
        return mx >= this.x && mx <= this.x + this.w && my >= this.y && my <= this.y + this.h;
    }

    hitHandle(mx: number, my: number): HandleId | null {
        for (const [id, cx, cy] of this.corners()) {
            if ((mx - cx) ** 2 + (my - cy) ** 2 <= HANDLE_R ** 2) return id;
        }
        return null;
    }

    /** The fixed corner opposite to the given handle. */
    anchor(handle: HandleId): [number, number] {
        return [
            handle.includes("l") ? this.x + this.w : this.x,
            handle.includes("t") ? this.y + this.h : this.y,
        ];
    }

    /** Position of the given handle corner. */
    handlePos(handle: HandleId): [number, number] {
        return [
            handle.includes("l") ? this.x : this.x + this.w,
            handle.includes("t") ? this.y : this.y + this.h,
        ];
    }

    draw(): void {
        noFill();
        stroke(17, 58, 240);
        strokeWeight(2);
        rect(this.x, this.y, this.w, this.h);

        fill(255);
        strokeWeight(1.5);
        for (const [_, cx, cy] of this.corners()) {
            circle(cx, cy, HANDLE_R * 2);
        }
    }

    private corners(): [HandleId, number, number][] {
        const { x, y, w, h } = this;
        return [["tl", x, y], ["tr", x + w, y], ["bl", x, y + h], ["br", x + w, y + h]];
    }
}
