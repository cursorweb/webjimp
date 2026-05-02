export abstract class Mode {
    abstract draw(): void;
    abstract mousePressed(): void;
    abstract mouseReleased(): void;
    mouseDragged(): void { }

    abstract onUndo(): void;
    abstract onRedo(): void;
}