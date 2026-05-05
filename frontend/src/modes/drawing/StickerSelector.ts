import { BoxHandle } from "../BoxHandle";
import type { HandleId } from "../BoxHandle";
import type { Sticker } from "../Sticker";

type DragState =
    | { kind: "idle" }
    | { kind: "moving"; startX: number; startY: number; origX: number; origY: number }
    | { kind: "resizing"; handle: HandleId; anchorX: number; anchorY: number; origX: number; origY: number; origW: number; origH: number; diagDx: number; diagDy: number };

export class StickerSelector {
    selected: Sticker | null = null;
    private drag: DragState = { kind: "idle" };

    get state() { return this.drag.kind; }

    private box(): BoxHandle | null {
        if (!this.selected) return null;
        return new BoxHandle(this.selected.x, this.selected.y, this.selected.width, this.selected.height);
    }

    select(sticker: Sticker): void {
        this.selected = sticker;
        this.drag = { kind: "idle" };
    }

    deselect(): void {
        this.selected = null;
        this.drag = { kind: "idle" };
    }

    /** Returns the topmost sticker at (x, y), or null. */
    hitTest(stickers: Sticker[], x: number, y: number): Sticker | null {
        for (let i = stickers.length - 1; i >= 0; i--) {
            const s = stickers[i];
            if (new BoxHandle(s.x, s.y, s.width, s.height).contains(x, y)) return s;
        }
        return null;
    }

    hitBody(x: number, y: number): boolean {
        return this.box()?.contains(x, y) ?? false;
    }

    hitHandle(x: number, y: number): HandleId | null {
        return this.box()?.hitHandle(x, y) ?? null;
    }

    startMove(x: number, y: number): void {
        if (!this.selected) return;
        this.drag = { kind: "moving", startX: x, startY: y, origX: this.selected.x, origY: this.selected.y };
    }

    updateMove(x: number, y: number): void {
        if (this.drag.kind != "moving" || !this.selected) return;
        this.selected.x = this.drag.origX + (x - this.drag.startX);
        this.selected.y = this.drag.origY + (y - this.drag.startY);
    }

    commitMove(): { origX: number; origY: number } | null {
        if (this.drag.kind != "moving" || !this.selected) return null;
        const { origX, origY } = this.drag;
        this.drag = { kind: "idle" };
        return { origX, origY };
    }

    startResize(handle: HandleId): void {
        if (!this.selected) return;
        const hb = this.box()!;
        const [anchorX, anchorY] = hb.anchor(handle);
        const [hx, hy] = hb.handlePos(handle);
        this.drag = {
            kind: "resizing", handle, anchorX, anchorY,
            origX: this.selected.x, origY: this.selected.y,
            origW: this.selected.width, origH: this.selected.height,
            diagDx: hx - anchorX, diagDy: hy - anchorY,
        };
    }

    updateResize(x: number, y: number): void {
        if (this.drag.kind != "resizing" || !this.selected) return;
        const { handle, anchorX, anchorY, origW, origH, diagDx, diagDy } = this.drag;

        const dist2 = diagDx * diagDx + diagDy * diagDy;
        const dot = (x - anchorX) * diagDx + (y - anchorY) * diagDy;
        const scale = Math.max(0.05, dot / dist2);

        const newW = origW * scale;
        const newH = origH * scale;
        this.selected.x = handle.includes("l") ? anchorX - newW : anchorX;
        this.selected.y = handle.includes("t") ? anchorY - newH : anchorY;
        this.selected.width = newW;
        this.selected.height = newH;
    }

    commitResize(): { oldX: number; oldY: number; oldW: number; oldH: number } | null {
        if (this.drag.kind != "resizing") return null;
        const { origX, origY, origW, origH } = this.drag;
        this.drag = { kind: "idle" };
        return { oldX: origX, oldY: origY, oldW: origW, oldH: origH };
    }

    draw(): void {
        this.box()?.draw();
    }
}
