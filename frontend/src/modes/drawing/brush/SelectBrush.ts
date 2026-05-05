import { MoveCommand, MoveStickerCommand, ResizeStickerCommand } from "../DrawingCommand";
import { Brush } from "../brush/Brush";
import { SelectionManager } from "../SelectionManager";
import { StickerSelector } from "../StickerSelector";
import type { Layer } from "../Layer";
import type { Command } from "../../HistoryManager";

export class SelectBrush extends Brush {
    private selection = new SelectionManager();
    private stickerSel = new StickerSelector();
    private activeLayer: Layer | null = null;

    deactivate() { this.stickerSel.deselect(); this.selection.deselect(); }
    resetState() { this.stickerSel.deselect(); this.selection.deselect(); }

    onMousePressed() {
        // 1. Selected sticker - check handles then body
        if (this.stickerSel.selected) {
            const handle = this.stickerSel.hitHandle(mouseX, mouseY);
            if (handle) { this.stickerSel.startResize(handle); return; }
            if (this.stickerSel.hitBody(mouseX, mouseY)) { this.stickerSel.startMove(mouseX, mouseY); return; }
        }

        // 2. Hit test stickers on active layer
        if (this.activeLayer) {
            const hit = this.stickerSel.hitTest(this.activeLayer.stickers, mouseX, mouseY);
            if (hit) { this.stickerSel.select(hit); return; }
        }

        // 3. Fall through to stroke selection
        this.stickerSel.deselect();
        if (this.selection.hasSelection && this.selection.isInsideBox(mouseX, mouseY)) {
            this.selection.startDrag(mouseX, mouseY);
        } else {
            this.selection.deselect();
            this.selection.startSelect(mouseX, mouseY);
        }
    }

    onMouseDragged() {
        if (this.stickerSel.state == "moving") { this.stickerSel.updateMove(mouseX, mouseY); return; }
        if (this.stickerSel.state == "resizing") { this.stickerSel.updateResize(mouseX, mouseY); return; }
        if (this.selection.state == "dragging") {
            this.selection.updateDrag(mouseX, mouseY);
        } else {
            this.selection.updateSelect(mouseX, mouseY);
        }
    }

    onMouseReleased(layer: Layer): Command | null {
        // Sticker move
        if (this.stickerSel.state == "moving") {
            const result = this.stickerSel.commitMove();
            const s = this.stickerSel.selected!;
            if (result && (s.x != result.origX || s.y != result.origY))
                return new MoveStickerCommand(s, s.x, s.y, result.origX, result.origY);
            return null;
        }

        // Sticker resize
        if (this.stickerSel.state == "resizing") {
            const result = this.stickerSel.commitResize();
            if (result) {
                const s = this.stickerSel.selected!;
                return new ResizeStickerCommand(s, s.x, s.y, s.width, s.height, result.oldX, result.oldY, result.oldW, result.oldH);
            }
            return null;
        }

        // Stroke drag
        if (this.selection.state == "dragging") {
            const { dx, dy } = this.selection.commitDrag();
            if (dx != 0 || dy != 0) return new MoveCommand(this.selection.selectedStrokes, dx, dy);
            return null;
        }

        this.selection.finalize(layer);
        return null;
    }

    drawLayer(layer: Layer, isActive: boolean) {
        if (isActive) this.activeLayer = layer;
        if (isActive && this.selection.selectedSet) {
            layer.previewOffset(this.selection.selectedSet, this.selection.offsetX, this.selection.offsetY);
        } else {
            layer.draw();
        }
    }

    drawCursor() {
        this.stickerSel.draw();
        this.selection.draw();
    }
}
