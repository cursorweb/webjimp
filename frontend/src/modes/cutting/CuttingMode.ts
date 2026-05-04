import { embed } from "./api";
import { Mode } from "../Mode";
import { SnipEditor } from "./SnipEditor";

const MAX_W = 800;
const MAX_H = 600;

export class CuttingMode extends Mode {
    private sourceImage: ImageBitmap | null = null;
    private scale = 1;
    private editor = new SnipEditor();

    /**
     * If reviewSticker is null, then we are in snipping phase
     * otherwise we are reviewing the sticker
     */
    private reviewSticker: ImageBitmap | null = null;

    private imageSubmit = document.querySelector<HTMLDivElement>(".image-submit")!;
    private segmentBtn = document.querySelector<HTMLButtonElement>(".segment-btn")!;
    private acceptBtn = document.querySelector<HTMLButtonElement>(".accept-btn")!;
    private rejectBtn = document.querySelector<HTMLButtonElement>(".reject-btn")!;
    private statusEl = document.querySelector<HTMLSpanElement>(".embed-status")!;

    constructor(private onSticker: (bitmap: ImageBitmap) => void) {
        super();

        this.imageSubmit.addEventListener("paste", (e: ClipboardEvent) => {
            const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith("image/"));
            if (!item) return;
            e.preventDefault();
            this.loadBlob(item.getAsFile()!);
        });

        document.querySelector<HTMLInputElement>(".image-upload")
            ?.addEventListener("change", (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) this.loadBlob(file);
            });

        this.segmentBtn.addEventListener("click", () => this.runSegment());
        this.acceptBtn.addEventListener("click", () => this.accept());
        this.rejectBtn.addEventListener("click", () => this.reject());

        fetch("example.png").then(r => r.blob()).then(b => this.loadBlob(b));
    }

    private async loadBlob(blob: Blob): Promise<void> {
        const raw = await createImageBitmap(blob);
        const scale = Math.min(1, MAX_W / raw.width, MAX_H / raw.height);
        const w = Math.round(raw.width * scale);
        const h = Math.round(raw.height * scale);
        const scaled = await createImageBitmap(raw, 0, 0, raw.width, raw.height, { resizeWidth: w, resizeHeight: h });
        raw.close();

        this.sourceImage?.close();
        this.sourceImage = scaled;
        this.scale = scale;
        this.editor.clear();
        resizeCanvas(w, h);

        this.statusEl.textContent = "⏳ embedding…";
        embed(blob)
            .then(data => { this.statusEl.textContent = data.success ? "✅ embedded" : `❌ ${data.error}`; })
            .catch(err => { this.statusEl.textContent = `❌ ${err.message}`; });
    }

    private async runSegment(): Promise<void> { }
    private accept(): void { }
    private reject(): void { }

    draw(): void {
        if (this.sourceImage) {
            (drawingContext as CanvasRenderingContext2D).drawImage(this.sourceImage, 0, 0);
        }
        if (!this.reviewSticker) {
            this.editor.draw();
        }
        // TODO: draw reviewSticker overlay
    }

    mousePressed(e: MouseEvent): void {
        if (!this.sourceImage || this.reviewSticker) return;
        this.editor.onMousePressed(constrain(mouseX, 0, width), constrain(mouseY, 0, height), e.button == 2);
    }

    mouseDragged(): void {
        if (!this.sourceImage || this.reviewSticker) return;
        this.editor.onMouseDragged(constrain(mouseX, 0, width), constrain(mouseY, 0, height));
    }

    mouseReleased(): void {
        if (!this.sourceImage || this.reviewSticker) return;
        this.editor.onMouseReleased(constrain(mouseX, 0, width), constrain(mouseY, 0, height));
        this.segmentBtn.disabled = !this.editor.hasBox;
    }

    onUndo(): void { }
    onRedo(): void { }
}
