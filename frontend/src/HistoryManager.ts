import type { Command } from "./Command";

export class HistoryManager {
    private static readonly MAX_HISTORY = 32;
    private undoStack: Command[] = [];
    private redoStack: Command[] = [];

    constructor() {
        window.addEventListener("keydown", (e) => {
            if (!e.ctrlKey && !e.metaKey) return;
            if (e.key == "z") { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); }
            if (e.key == "y") { e.preventDefault(); this.redo(); }
        });
    }

    executeCommand(cmd: Command) {
        cmd.execute();
        this.undoStack.push(cmd);
        if (this.undoStack.length > HistoryManager.MAX_HISTORY) this.undoStack.shift();
        this.redoStack = [];
    }

    undo() {
        const cmd = this.undoStack.pop();
        if (!cmd) return;
        cmd.undo();
        this.redoStack.push(cmd);
    }

    redo() {
        const cmd = this.redoStack.pop();
        if (!cmd) return;
        cmd.execute();
        this.undoStack.push(cmd);
    }
}
