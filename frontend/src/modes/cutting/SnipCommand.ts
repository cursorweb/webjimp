import type { Command } from "../HistoryManager";
import type { Box, ClickPoint, SnipEditor } from "./SnipEditor";

export class ChangeBoxCommand implements Command {
    constructor(
        private previousBox: Box | null,
        private currentBox: Box,
        private editor: SnipEditor
    ) { }

    execute() { this.editor.box = this.currentBox; }
    undo() { this.editor.box = this.previousBox; }
}

export class AddPointCommand implements Command {
    constructor(
        private point: ClickPoint,
        private editor: SnipEditor,
    ) { }

    execute() { this.editor.points.push(this.point); }
    // undo means this point MUST be the topmost point
    undo() { this.editor.points.pop(); }
}

export class RemovePointCommand implements Command {
    constructor(
        private idx: number,
        private point: ClickPoint,
        private editor: SnipEditor,
    ) { }

    execute() { this.editor.points.splice(this.idx, 1); }
    undo() { this.editor.points.push(this.point); }
}