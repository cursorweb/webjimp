import "p5";
import { embed } from "./api";
import { Sticker } from "./Sticker";
import { CuttingMode } from "./CuttingMode";

const imageSubmit: HTMLDivElement = document.querySelector(".image-submit")!;
const imageUpload: HTMLInputElement = document.querySelector(".image-upload")!;
const embedStatus: HTMLSpanElement = document.querySelector(".embed-status")!;

let sticker: Sticker | null;

const cuttingMode = new CuttingMode();
cuttingMode.onSticker = (s) => { sticker = s; };

window.setup = () => {
    createCanvas(800, 600).parent("canvas-container");
    background(30);

    fetch("/example.png")
        .then((r) => r.blob())
        .then(drawBaseImage);
};

window.draw = () => {
    background(0);
    cuttingMode.draw();

    if (sticker) {
        sticker.draw();
    }
};

window.mousePressed = () => cuttingMode.mousePressed();
window.mouseReleased = () => cuttingMode.mouseReleased();

const MAX_W = 800;
const MAX_H = 600;

async function drawBaseImage(blob: Blob) {
    const bitmap = await createImageBitmap(blob);
    const scaleNumber = Math.min(1, MAX_W / bitmap.width, MAX_H / bitmap.height);
    const w = Math.round(bitmap.width * scaleNumber);
    const h = Math.round(bitmap.height * scaleNumber);
    cuttingMode.currentBitmap?.close();
    cuttingMode.currentBitmap = await createImageBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, { resizeWidth: w, resizeHeight: h });
    bitmap.close();
    cuttingMode.currentScale = scaleNumber;
    resizeCanvas(w, h);

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
    if (file) drawBaseImage(file);
});

imageSubmit.addEventListener("paste", (e: ClipboardEvent) => {
    const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/")
    );
    if (!item) return;
    e.preventDefault();
    drawBaseImage(item.getAsFile()!);
});
