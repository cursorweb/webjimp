import "p5";
// import { embed } from "./api";
// import { Sticker } from "./Sticker";
// import { CuttingMode } from "./CuttingMode";
import type { Mode } from "./Mode";
import { DrawingMode } from "./DrawingMode";

// const imageSubmit: HTMLDivElement = document.querySelector(".image-submit")!;
// const imageUpload: HTMLInputElement = document.querySelector(".image-upload")!;
// const embedStatus: HTMLSpanElement = document.querySelector(".embed-status")!;

// let sticker: Sticker | null;

// const mode: Mode = new CuttingMode(s => sticker = s);
let mode: Mode;

window.setup = () => {
    createCanvas(800, 600).parent("canvas-container");
    background(30);

    mode = new DrawingMode();

    // fetch("/example.png")
    //     .then((r) => r.blob())
    //     .then(drawBaseImage);
};

window.draw = () => {
    background(0);
    mode.draw();
};

window.mousePressed = () => mode.mousePressed();
window.mouseDragged = () => mode.mouseDragged();
window.mouseReleased = () => mode.mouseReleased();


/// basic init
// const MAX_W = 800;
// const MAX_H = 600;

// async function drawBaseImage(blob: Blob) {
//     const bitmap = await createImageBitmap(blob);
//     const scaleNumber = Math.min(1, MAX_W / bitmap.width, MAX_H / bitmap.height);
//     const w = Math.round(bitmap.width * scaleNumber);
//     const h = Math.round(bitmap.height * scaleNumber);
//     mode.currentBitmap?.close();
//     mode.currentBitmap = await createImageBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, { resizeWidth: w, resizeHeight: h });
//     bitmap.close();
//     mode.currentScale = scaleNumber;
//     resizeCanvas(w, h);

//     embedStatus.textContent = "⏳ embedding…";
//     embed(blob)
//         .then((data) => {
//             embedStatus.textContent = data.success ? "✅ embedded" : `❌ ${data.error}`;
//         })
//         .catch((err) => {
//             embedStatus.textContent = `❌ ${err.message}`;
//         });
// }

// imageUpload.addEventListener("change", () => {
//     const file = imageUpload.files?.[0];
//     if (file) drawBaseImage(file);
// });

// imageSubmit.addEventListener("paste", (e: ClipboardEvent) => {
//     const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
//         i.type.startsWith("image/")
//     );
//     if (!item) return;
//     e.preventDefault();
//     drawBaseImage(item.getAsFile()!);
// });
