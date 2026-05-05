import type { Command } from "../HistoryManager";
import { AddPointCommand, ChangeBoxCommand, RemovePointCommand } from "./SnipCommand";

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

const HANDLE_RADIUS = 8;
const POINT_RADIUS = 6;
const POINT_HIT_RADIUS = POINT_RADIUS + 4;

type HandleId = "tl" | "tr" | "bl" | "br";

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
        const handleId = this.hitHandle(x, y);
        if (handleId) {
            this.drag = { kind: "resize", handleId, ...this.fixedAnchor(handleId) };
        } else if (this.box && inRect(x, y, this.box.x1, this.box.y1, this.box.x2, this.box.y2)) {
            this.drag = { kind: "move", sx: x, sy: y, moved: false };
        } else {
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
        if (this.box) {
            this.drawBox(this.box);
        }

        for (const pt of this.points) {
            this.drawPoint(pt);
        }
        pop();
    }

    private drawBox(b: Box): void {
        noFill();
        stroke(17, 58, 240);
        strokeWeight(2);
        rect(b.x1, b.y1, b.x2 - b.x1, b.y2 - b.y1);

        fill(255);
        strokeWeight(1.5);
        for (const [hx, hy] of this.corners(b)) {
            circle(hx, hy, HANDLE_RADIUS * 2);
        }
    }

    private drawPoint(pt: ClickPoint): void {
        strokeWeight(1.5);
        stroke(0, 0, 0, 180);
        fill(pt.foreground ? color(60, 200, 60) : color(220, 60, 60));
        circle(pt.x, pt.y, POINT_RADIUS * 2);
    }

    private hitHandle(x: number, y: number): HandleId | null {
        if (!this.box) return null;
        const ids: HandleId[] = ["tl", "tr", "bl", "br"];
        const corners = this.corners(this.box);
        for (let i = 0; i < ids.length; i++) {
            const [hx, hy] = corners[i];
            if (dist2(hx, hy, x, y) <= HANDLE_RADIUS ** 2) {
                return ids[i];
            }
        }
        return null;
    }

    private fixedAnchor(handle: HandleId): { ax: number; ay: number } {
        const { x1, y1, x2, y2 } = this.box!;
        return {
            ax: handle.includes("l") ? x2 : x1,
            ay: handle.includes("t") ? y2 : y1,
        };
    }

    private corners(b: Box): [number, number][] {
        return [[b.x1, b.y1], [b.x2, b.y1], [b.x1, b.y2], [b.x2, b.y2]];
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

function inRect(mx: number, my: number, x1: number, y1: number, x2: number, y2: number) {
    return mx >= x1 && my >= y1 && mx <= x2 && my <= y2;
}