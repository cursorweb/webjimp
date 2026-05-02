import type { Layer } from "../../../Layer";
import type { Command } from "../Command";

export abstract class Brush {
    abstract onMousePressed(): void;
    abstract onMouseDragged(): void;
    abstract onMouseReleased(layer: Layer): Command | null;
    abstract drawLayer(layer: Layer, isActive: boolean): void;
    abstract drawCursor(): void;

    /**
     * Activate dom listeners
     */
    activate() { }
    deactivate() { }

    /**
     * Reset state for undos
     */
    resetState() { }
}
