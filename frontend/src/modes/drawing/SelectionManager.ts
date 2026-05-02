import type { Layer } from "../../Layer";
import type { Stroke } from "./Stroke";

type State = "idle" | "selecting" | "selected" | "dragging";

export class SelectionManager {
    state: State = "idle";

    private selectStart = [0, 0];
    private selectEnd = [0, 0];

    box: { x1: number; y1: number; x2: number; y2: number } | null = null;
    selectedStrokes: Stroke[] = [];

    private dragAnchor = [0, 0];
    offsetX = 0;
    offsetY = 0;

    get hasSelection() { return this.selectedStrokes.length > 0; }

    isInsideBox(x: number, y: number): boolean {
        if (!this.box) return false;
        const { x1, y1, x2, y2 } = this.box;
        return x >= x1 && x <= x2 && y >= y1 && y <= y2;
    }

    startSelect(x: number, y: number) {
        this.state = "selecting";
        this.selectStart = [x, y];
        this.selectEnd = [x, y];
    }

    updateSelect(x: number, y: number) {
        this.selectEnd = [x, y];
    }

    /**
     * After finish selecting, finalize selection
     */
    finalize(layer: Layer) {
        const x1 = Math.min(this.selectStart[0], this.selectEnd[0]);
        const y1 = Math.min(this.selectStart[1], this.selectEnd[1]);
        const x2 = Math.max(this.selectStart[0], this.selectEnd[0]);
        const y2 = Math.max(this.selectStart[1], this.selectEnd[1]);

        // too small
        if (x2 - x1 < 2 && y2 - y1 < 2) {
            this.state = "idle";
            return;
        }

        this.box = { x1, y1, x2, y2 };
        this.selectedStrokes = layer.strokes.filter(s =>
            s.points.some(([px, py]) => this.isInsideBox(px, py))
        );

        if (this.selectedStrokes.length > 0) {
            this.state = "selected";
        } else {
            this.state = "idle";
            this.box = null;
        }
    }

    startDrag(x: number, y: number) {
        this.state = "dragging";
        this.dragAnchor = [x, y];
        this.offsetX = 0;
        this.offsetY = 0;
    }

    updateDrag(x: number, y: number) {
        this.offsetX = x - this.dragAnchor[0];
        this.offsetY = y - this.dragAnchor[1];
    }

    commitDrag(): { dx: number; dy: number } {
        const dx = this.offsetX;
        const dy = this.offsetY;
        if (this.box) {
            this.box = {
                x1: this.box.x1 + dx,
                y1: this.box.y1 + dy,
                x2: this.box.x2 + dx,
                y2: this.box.y2 + dy,
            };
        }
        this.offsetX = 0;
        this.offsetY = 0;
        this.state = "selected";
        return { dx, dy };
    }

    deselect() {
        this.state = "idle";
        this.box = null;
        this.selectedStrokes = [];
        this.offsetX = 0;
        this.offsetY = 0;
    }

    draw() {
        noFill();
        strokeWeight(1);
        stroke(255, 255, 255, 180);
        const ctx = drawingContext as CanvasRenderingContext2D;
        ctx.setLineDash([5, 5]);

        if (this.state == "selecting") {
            const x1 = Math.min(this.selectStart[0], this.selectEnd[0]);
            const y1 = Math.min(this.selectStart[1], this.selectEnd[1]);
            rect(x1, y1, Math.max(this.selectStart[0], this.selectEnd[0]) - x1, Math.max(this.selectStart[1], this.selectEnd[1]) - y1);
        } else if (this.box) {
            rect(
                this.box.x1 + this.offsetX, this.box.y1 + this.offsetY,
                this.box.x2 - this.box.x1, this.box.y2 - this.box.y1
            );
        }

        ctx.setLineDash([]);
    }
}
