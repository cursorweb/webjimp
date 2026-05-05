import { HistoryManager } from "../HistoryManager";
import { Mode } from "../Mode";
import { SnipUI } from "./SnipUI";
import { StickerManager } from "./StickerManager";

export class CuttingMode extends Mode {
    private editor = new SnipUI();
    private stickerManager = new StickerManager(this.editor);
    private history = new HistoryManager();

    private imageSubmit = document.querySelector<HTMLDivElement>(".image-submit")!;
    private segmentBtn = document.querySelector<HTMLButtonElement>(".segment-btn")!;
    private acceptBtn = document.querySelector<HTMLButtonElement>(".accept-btn")!;

    constructor() {
        super();

        this.imageSubmit.addEventListener("paste", e => {
            const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith("image/"));
            if (!item) return;
            e.preventDefault();
            this.loadBlob(item.getAsFile()!);
        });

        document.querySelector<HTMLInputElement>(".image-upload")!.addEventListener("change", e => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) this.loadBlob(file);
        });

        this.segmentBtn.addEventListener("click", () => this.stickerManager.segment());
        this.acceptBtn.addEventListener("click", () => this.stickerManager.addSticker());

        // debugging purposes
        fetch("example.png").then(r => r.blob()).then(b => this.loadBlob(b));
    }

    private async loadBlob(blob: Blob): Promise<void> {
        const [w, h] = await this.stickerManager.loadBlob(blob);
        this.editor.clear();
        resizeCanvas(w, h);
    }

    draw(): void {
        this.stickerManager.draw();
        this.editor.draw();
    }

    mousePressed(): void {
        const x = constrain(mouseX, 0, width), y = constrain(mouseY, 0, height);
        const cmd = this.editor.onMousePressed(x, y);
        if (cmd) this.history.executeCommand(cmd);
    }

    mouseDragged(): void {
        this.editor.onMouseDragged(constrain(mouseX, 0, width), constrain(mouseY, 0, height));
    }

    mouseReleased(): void {
        const cmd = this.editor.onMouseReleased(constrain(mouseX, 0, width), constrain(mouseY, 0, height));
        if (cmd) this.history.executeCommand(cmd);
        this.segmentBtn.disabled = !this.editor.hasBox;
        this.stickerManager.segment();
    }

    onUndo(): void {
        this.history.undo();
    }

    onRedo(): void {
        this.history.redo();
    }
}
