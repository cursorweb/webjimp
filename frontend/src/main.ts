/// <reference types="p5/global" />
import "p5";
import { embed } from "./api";
import { BoundingBox, Snip } from "./Snipping";

const imageSubmit: HTMLDivElement = document.querySelector(".image-submit")!;
const imageUpload: HTMLInputElement = document.querySelector(".image-upload")!;
const embedStatus: HTMLSpanElement = document.querySelector(".embed-status")!;
const segmentBtn: HTMLButtonElement = document.querySelector(".segment-btn")!;

let startPoint = [0, 0];
let currentBitmap: ImageBitmap | null = null;
let currentScale = 1;

const snipping = new Snip();

window.setup = () => {
    createCanvas(800, 600).parent("canvas-container");
    background(30);

    // load example
    fetch("/example.png")
        .then((r) => r.blob())
        .then(drawBlobToCanvas);
};

window.draw = () => {
    background(0);

    if (currentBitmap) {
        (drawingContext as CanvasRenderingContext2D).drawImage(currentBitmap, 0, 0);
    }

    if (mouseIsPressed) {
        const endPoint = [constrain(mouseX, 0, width), constrain(mouseY, 0, height)];
        noFill();
        strokeWeight(2);
        stroke(255, 0, 0);
        rect(startPoint[0], startPoint[1], endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]);
    }

    snipping.draw(currentScale);
};

window.mousePressed = () => {
    startPoint = [mouseX, mouseY];
};

window.mouseReleased = () => {
    const x1 = constrain(Math.min(startPoint[0], mouseX), 0, width) / currentScale;
    const y1 = constrain(Math.min(startPoint[1], mouseY), 0, height) / currentScale;
    const x2 = constrain(Math.max(startPoint[0], mouseX), 0, width) / currentScale;
    const y2 = constrain(Math.max(startPoint[1], mouseY), 0, height) / currentScale;

    if (x2 - x1 < 2 || y2 - y1 < 2) return;

    snipping.addMask(new BoundingBox(x1, y1, x2, y2));
    segmentBtn.disabled = false;

    const canvasRect = (drawingContext as CanvasRenderingContext2D).canvas.getBoundingClientRect();
    segmentBtn.style.position = "fixed";
    segmentBtn.style.left = `${canvasRect.left + x2 * currentScale}px`;
    segmentBtn.style.top = `${canvasRect.top + y2 * currentScale}px`;
};

segmentBtn.addEventListener("click", async () => {
    if (!snipping.hasSelections) return;

    segmentBtn.disabled = true;
    embedStatus.textContent = "⏳ segmenting…";
    try {
        const bitmap = await snipping.segment(width, height);
        currentBitmap?.close();
        currentBitmap = null;
        currentBitmap = bitmap;
        snipping.clear();
        embedStatus.textContent = "✅ segmented";
    } catch (err: any) {
        embedStatus.textContent = `❌ ${err.message}`;
        segmentBtn.disabled = false;
    }
});

const MAX_W = 800;
const MAX_H = 600;

async function drawBlobToCanvas(blob: Blob) {
    const bitmap = await createImageBitmap(blob);
    const scaleNumber = Math.min(1, MAX_W / bitmap.width, MAX_H / bitmap.height);
    const w = Math.round(bitmap.width * scaleNumber);
    const h = Math.round(bitmap.height * scaleNumber);
    currentBitmap?.close();
    currentBitmap = null;
    currentBitmap = await createImageBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, { resizeWidth: w, resizeHeight: h });
    bitmap.close();
    currentScale = scaleNumber;
    resizeCanvas(w, h);
    snipping.clear();
    segmentBtn.disabled = true;

    embedStatus.textContent = "⏳ embedding…";
    embed(blob)
        .then((data) => {
            embedStatus.textContent = data.success ? "✅ embedded" : `❌ ${data.error}`;
        })
        .catch((err) => {
            embedStatus.textContent = `❌ ${err.message}`;
        });
}

imageUpload.addEventListener("change", () => {
    const file = imageUpload.files?.[0];
    if (file) drawBlobToCanvas(file);
});

imageSubmit.addEventListener("paste", (e: ClipboardEvent) => {
    const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/")
    );
    if (!item) return;
    e.preventDefault();
    drawBlobToCanvas(item.getAsFile()!);
});