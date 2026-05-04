import { MoveCommand } from "../DrawingCommand";
import { Brush } from "../brush/Brush";
import { SelectionManager } from "../SelectionManager";
import type { Layer } from "../Layer";
import type { Command } from "../../HistoryManager";

export class SelectBrush extends Brush {
    private selection = new SelectionManager();

    deactivate() { this.selection.deselect(); }
    resetState() { this.selection.deselect(); }

    onMousePressed() {
        if (this.selection.hasSelection && this.selection.isInsideBox(mouseX, mouseY)) {
            this.selection.startDrag(mouseX, mouseY);
        } else {
            this.selection.deselect();
            this.selection.startSelect(mouseX, mouseY);
        }
    }

    onMouseDragged() {
        if (this.selection.state == "dragging") {
            this.selection.updateDrag(mouseX, mouseY);
        } else {
            this.selection.updateSelect(mouseX, mouseY);
        }
    }

    onMouseReleased(layer: Layer): Command | null {
        if (this.selection.state == "dragging") {
            const { dx, dy } = this.selection.commitDrag();
            if (dx != 0 || dy != 0) return new MoveCommand(this.selection.selectedStrokes, dx, dy);
            return null;
        }
        this.selection.finalize(layer);
        return null;
    }

    drawLayer(layer: Layer, isActive: boolean) {
        if (isActive && this.selection.selectedSet) {
            layer.previewOffset(this.selection.selectedSet, this.selection.offsetX, this.selection.offsetY);
        } else {
            layer.draw();
        }
    }

    drawCursor() {
        this.selection.draw();
    }
}
