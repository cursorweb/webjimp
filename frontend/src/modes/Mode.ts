export abstract class Mode {
    abstract draw(): void;
    abstract mousePressed(e: MouseEvent): void;
    abstract mouseReleased(e: MouseEvent): void;
    mouseDragged(e: MouseEvent): void { }

    abstract onUndo(): void;
    abstract onRedo(): void;
}