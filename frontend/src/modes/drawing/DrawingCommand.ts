import type { Command } from "../HistoryManager";
import type { Layer } from "./Layer";
import type { Sticker } from "../Sticker";
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

export class MoveStickerCommand implements Command {
    constructor(private sticker: Sticker, private newX: number, private newY: number, private oldX: number, private oldY: number) { }
    execute() { this.sticker.x = this.newX; this.sticker.y = this.newY; }
    undo() { this.sticker.x = this.oldX; this.sticker.y = this.oldY; }
}

export class ResizeStickerCommand implements Command {
    constructor(
        private sticker: Sticker,
        private newX: number, private newY: number, private newW: number, private newH: number,
        private oldX: number, private oldY: number, private oldW: number, private oldH: number,
    ) { }
    execute() { this.sticker.x = this.newX; this.sticker.y = this.newY; this.sticker.width = this.newW; this.sticker.height = this.newH; }
    undo() { this.sticker.x = this.oldX; this.sticker.y = this.oldY; this.sticker.width = this.oldW; this.sticker.height = this.oldH; }
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

