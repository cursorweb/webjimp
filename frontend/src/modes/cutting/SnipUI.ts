import type { Command } from "../HistoryManager";
import { AddPointCommand, ChangeBoxCommand, RemovePointCommand } from "./SnipCommand";
import { BoxHandle } from "../BoxHandle";
import type { HandleId } from "../BoxHandle";

export interface ClickPoint {
    x: number;
    y: number;
    foreground: boolean;
}

export interface Box { x1: number; y1: number; x2: number; y2: number; }

export interface SnipPayload {
    box: Box;
    points: ClickPoint[];
}

const POINT_RADIUS = 6;
const POINT_HIT_RADIUS = POINT_RADIUS + 4;

// TODO: if the selection is too small, ignore it
type DragAction =
    | { kind: "draw"; sx: number; sy: number; makeBox: boolean }
    | { kind: "move"; sx: number; sy: number; moved: boolean }
    | { kind: "resize"; handleId: HandleId; ax: number; ay: number };

export class SnipUI {
    box: Box | null = null;
    points: ClickPoint[] = [];
    private drag: DragAction | null = null;
    private prevBox: Box | null = null;

    get hasBox(): boolean { return this.box != null; }

    onMousePressed(x: number, y: number) {
        if (mouseButton.left) {
            return this.onLeftPressed(x, y);
        } else {
            return this.onRightPressed(x, y);
        }
    }

    /** Left click: remove nearby point, or start a drag */
    private onLeftPressed(x: number, y: number): Command | null {
        const hitIdx = this.points.findIndex(p => dist2(p.x, p.y, x, y) <= POINT_HIT_RADIUS ** 2);
        if (hitIdx >= 0) {
            return new RemovePointCommand(hitIdx, this.points[hitIdx], this);
        }

        this.prevBox = this.box;
        const bh = this.boxHandle();
        const handleId = bh?.hitHandle(x, y) ?? null;
        if (handleId) {
            const [ax, ay] = bh!.anchor(handleId);
            this.drag = { kind: "resize", handleId, ax, ay };
        } else if (bh?.contains(x, y)) {
            this.drag = { kind: "move", sx: x, sy: y, moved: false };
        } else {
            // makebox becomes true only once you start dragging
            this.drag = { kind: "draw", sx: x, sy: y, makeBox: false };
        }
        return null;
    }

    /** Right click: always add a background point, or remove point */
    private onRightPressed(x: number, y: number): Command {
        const hitIdx = this.points.findIndex(p => dist2(p.x, p.y, x, y) <= POINT_HIT_RADIUS ** 2);
        if (hitIdx >= 0) {
            return new RemovePointCommand(hitIdx, this.points[hitIdx], this);
        }

        return new AddPointCommand({ x, y, foreground: false }, this);
    }

    onMouseDragged(x: number, y: number): void {
        if (!this.drag) return;

        if (this.drag.kind == "draw") {
            const { sx, sy } = this.drag;
            this.drag.makeBox = true;
            this.box = makeBox(sx, sy, x, y);
        } else if (this.drag.kind == "move") {
            const { sx, sy } = this.drag;
            this.drag.moved = true;
            const dx = x - sx, dy = y - sy;
            this.box = { x1: this.prevBox!.x1 + dx, y1: this.prevBox!.y1 + dy, x2: this.prevBox!.x2 + dx, y2: this.prevBox!.y2 + dy };
        } else {
            // resize
            this.box = makeBox(this.drag.ax, this.drag.ay, x, y);
        }
    }

    onMouseReleased(x: number, y: number): Command | null {
        if (!this.drag) return null;

        let cmd: Command | null = null;
        if (this.drag.kind == "draw") {
            cmd = this.drag.makeBox && this.box
                ? new ChangeBoxCommand(this.prevBox, this.box, this)
                : new AddPointCommand({ x, y, foreground: true }, this);
        } else if (this.drag.kind == "move") {
            if (this.drag.moved && this.box) cmd = new ChangeBoxCommand(this.prevBox, this.box, this);
            else cmd = new AddPointCommand({ x, y, foreground: true }, this);
        } else {
            if (this.box) cmd = new ChangeBoxCommand(this.prevBox, this.box, this);
        }

        this.drag = null;
        return cmd;
    }

    /** Returns all coords converted to image space */
    toPayload(scale: number): SnipPayload {
        const { x1, y1, x2, y2 } = this.box!;
        return {
            box: { x1: x1 / scale, y1: y1 / scale, x2: x2 / scale, y2: y2 / scale },
            points: this.points.map(p => ({ x: p.x / scale, y: p.y / scale, foreground: p.foreground })),
        };
    }

    draw(): void {
        push();
        this.boxHandle()?.draw();
        for (const pt of this.points) {
            this.drawPoint(pt);
        }
        pop();
    }

    private boxHandle(): BoxHandle | null {
        if (!this.box) return null;
        const { x1, y1, x2, y2 } = this.box;
        return new BoxHandle(x1, y1, x2 - x1, y2 - y1);
    }

    private drawPoint(pt: ClickPoint): void {
        strokeWeight(1.5);
        stroke(0, 0, 0, 180);
        fill(pt.foreground ? color(60, 200, 60) : color(220, 60, 60));
        circle(pt.x, pt.y, POINT_RADIUS * 2);
    }

    clear(): void {
        this.box = null;
        this.points = [];
        this.drag = null;
    }
}

function dist2(x1: number, y1: number, x2: number, y2: number): number {
    return (x2 - x1) ** 2 + (y2 - y1) ** 2;
}

function makeBox(x1: number, y1: number, x2: number, y2: number): Box {
    return {
        x1: Math.min(x1, x2), y1: Math.min(y1, y2),
        x2: Math.max(x1, x2), y2: Math.max(y1, y2),
    };
}
