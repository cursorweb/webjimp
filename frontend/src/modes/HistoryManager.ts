export interface Command {
    execute(): void;
    undo(): void;
}

export class HistoryManager {
    private static readonly MAX_HISTORY = 32;
    private undoStack: Command[] = [];
    private redoStack: Command[] = [];

    /**
     * Execute the change, and also save the command
     */
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
