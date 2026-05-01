import { Mode } from "./Mode";
import { BoundingBox, Snip } from "./Snip";
import { Sticker } from "./Sticker";

export class CuttingMode extends Mode {
    currentBitmap: ImageBitmap | null = null;
    currentScale: number = 1;

    private snipping = new Snip();
    private startPoint = [0, 0];
    private segmentBtn: HTMLButtonElement = document.querySelector(".segment-btn")!;
    private embedStatus: HTMLSpanElement = document.querySelector(".embed-status")!;

    constructor(onSticker: (sticker: Sticker) => void) {
        super();
        this.segmentBtn.addEventListener("click", async () => {
            if (!this.snipping.hasSelections) return;

            this.segmentBtn.disabled = true;
            this.embedStatus.textContent = "⏳ segmenting…";
            try {
                const bitmap = await this.snipping.segment(width, height);
                this.currentBitmap?.close();
                this.currentBitmap = bitmap.bg;
                const sticker = new Sticker(0, 0, bitmap.sticker);
                sticker.width = bitmap.sticker.width * this.currentScale;
                sticker.height = bitmap.sticker.height * this.currentScale;
                this.snipping.clear();
                this.embedStatus.textContent = "✅ segmented";
                onSticker(sticker);
            } catch (err: any) {
                this.embedStatus.textContent = `❌ ${err.message}`;
                this.segmentBtn.disabled = false;
            }
        });
    }

    draw() {
        if (this.currentBitmap) {
            (drawingContext as CanvasRenderingContext2D).drawImage(this.currentBitmap, 0, 0);
        }

        if (mouseIsPressed) {
            const endPoint = [constrain(mouseX, 0, width), constrain(mouseY, 0, height)];
            noFill();
            strokeWeight(2);
            stroke(255, 0, 0);
            rect(this.startPoint[0], this.startPoint[1], endPoint[0] - this.startPoint[0], endPoint[1] - this.startPoint[1]);
        } else {
            this.snipping.draw(this.currentScale);
        }
    }

    mousePressed() {
        this.startPoint = [mouseX, mouseY];
    }

    mouseReleased() {
        const scale = this.currentScale;
        const x1 = constrain(Math.min(this.startPoint[0], mouseX), 0, width) / scale;
        const y1 = constrain(Math.min(this.startPoint[1], mouseY), 0, height) / scale;
        const x2 = constrain(Math.max(this.startPoint[0], mouseX), 0, width) / scale;
        const y2 = constrain(Math.max(this.startPoint[1], mouseY), 0, height) / scale;

        if (x2 - x1 < 2 || y2 - y1 < 2) return;

        this.snipping.setMask(new BoundingBox(x1, y1, x2, y2));
        this.segmentBtn.disabled = false;

        const canvasRect = (drawingContext as CanvasRenderingContext2D).canvas.getBoundingClientRect();
        this.segmentBtn.style.position = "fixed";
        this.segmentBtn.style.left = `${canvasRect.left + x2 * scale}px`;
        this.segmentBtn.style.top = `${canvasRect.top + y2 * scale}px`;
    }
}
