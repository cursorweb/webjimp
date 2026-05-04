export interface ClickPoint {
    x: number;
    y: number;
    foreground: boolean;
}

export interface SnipPayload {
    box: { x1: number; y1: number; x2: number; y2: number };
    points: ClickPoint[];
}

const HANDLE_RADIUS = 8;
const POINT_RADIUS = 6;
const DRAG_THRESHOLD = 10;
const POINT_HIT_RADIUS = POINT_RADIUS + 4;

type HandleId = "tl" | "tr" | "bl" | "br";
interface Box { x1: number; y1: number; x2: number; y2: number; }

type DragAction =
    | { kind: "draw"; sx: number; sy: number; makeBox: boolean }
    | { kind: "move"; sx: number; sy: number; origBox: Box; moved: boolean }
    | { kind: "resize"; handleId: HandleId; dx: number; dy: number };

export class SnipEditor {
    private box: Box | null = null;
    private points: ClickPoint[] = [];
    private drag: DragAction | null = null;

    get hasBox(): boolean { return this.box != null; }

    /** x, y in canvas pixels */
    onMousePressed(x: number, y: number, backgroundPoint: boolean): void {
        const hitIdx = this.points.findIndex(p => dist2(p.x, p.y, x, y) <= POINT_HIT_RADIUS ** 2);
        if (hitIdx >= 0) {
            this.points.splice(hitIdx, 1);
            return;
        }

        if (backgroundPoint) {
            this.points.push({ x, y, foreground: false });
            return;
        }

        const handleId = this.hitHandle(x, y);
        if (handleId) {
            this.drag = { kind: "resize", handleId, ...this.fixedCorner(handleId) };
        } else if (this.box && inRect(x, y, this.box.x1, this.box.y1, this.box.x2, this.box.y2)) {
            this.drag = { kind: "move", sx: x, sy: y, origBox: this.box, moved: false };
        } else {
            this.drag = { kind: "draw", sx: x, sy: y, makeBox: false };
        }
    }

    onMouseDragged(x: number, y: number): void {
        if (!this.drag) return;

        if (this.drag.kind == "draw") {
            const { sx, sy } = this.drag;
            if (dist2(sx, sy, x, y) >= DRAG_THRESHOLD ** 2) {
                this.drag.makeBox = true;
                this.box = makeBox(sx, sy, x, y);
            }
        } else if (this.drag.kind == "move") {
            const { sx, sy, origBox } = this.drag;
            if (dist2(sx, sy, x, y) >= DRAG_THRESHOLD ** 2) {
                this.drag.moved = true;
                const dx = x - sx, dy = y - sy;
                this.box = { x1: origBox.x1 + dx, y1: origBox.y1 + dy, x2: origBox.x2 + dx, y2: origBox.y2 + dy };
            }
        } else {
            // resize
            this.box = makeBox(this.drag.dx, this.drag.dy, x, y);
        }
    }

    onMouseReleased(x: number, y: number): void {
        if (!this.drag) return;

        if ((this.drag.kind == "draw" && !this.drag.makeBox) ||
            (this.drag.kind == "move" && !this.drag.moved)) {
            this.points.push({ x, y, foreground: true });
        }

        this.drag = null;
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
        stroke(120, 30, 40);
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

    private fixedCorner(handle: HandleId): { dx: number; dy: number } {
        const { x1, y1, x2, y2 } = this.box!;
        return {
            dx: handle.includes("l") ? x2 : x1,
            dy: handle.includes("t") ? y2 : y1,
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