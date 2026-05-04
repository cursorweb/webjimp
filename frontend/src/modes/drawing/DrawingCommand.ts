import type { Command } from "../HistoryManager";
import type { Layer } from "./Layer";
import type { Stroke } from "./Stroke";

export class AddStrokeCommand implements Command {
    constructor(private layer: Layer, private stroke: Stroke) { }

    execute() { this.layer.addStroke(this.stroke); }
    undo() { this.layer.removeStrokes([this.stroke]); }
}

export class EraseCommand implements Command {
    private removed: Stroke[] = [];

    constructor(private layer: Layer, private eraser: Stroke) { }

    execute() {
        this.removed = this.layer.getHits(this.eraser);
        this.layer.removeStrokes(this.removed);
    }

    undo() { this.layer.addStrokes(this.removed); }
}

export class MoveCommand implements Command {
    constructor(private strokes: Stroke[], private dx: number, private dy: number) { }

    execute() {
        for (const s of this.strokes) {
            for (const pt of s.points) {
                pt[0] += this.dx;
                pt[1] += this.dy;
            }
        }
    }

    undo() {
        for (const s of this.strokes) {
            for (const pt of s.points) {
                pt[0] -= this.dx;
                pt[1] -= this.dy;
            }
        }
    }
}

