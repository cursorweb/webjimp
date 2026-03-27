/// <reference types="p5/global" />
import "p5";

const API_BACKEND = "http://127.0.0.1:8000";

const imageSubmit: HTMLDivElement = document.querySelector(".image-submit")!;
const imageUpload: HTMLInputElement = document.querySelector(".image-upload")!;
const embedStatus: HTMLSpanElement = document.querySelector(".embed-status")!;

let startPoint = [0, 0];
let currentBitmap: ImageBitmap | null = null;

// we resize the image so it's not too big
let currentScale = 1;

window.setup = () => {
    createCanvas(800, 600).parent("canvas-container");
    background(30);
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
        const endPoint = [mouseX, mouseY];
        noFill();
        strokeWeight(2);
        stroke(255, 0, 0);
        rect(startPoint[0], startPoint[1], endPoint[0] - startPoint[0], endPoint[1] - startPoint[1]);
    }
};

window.mousePressed = () => {
    startPoint = [mouseX, mouseY];
};

window.mouseReleased = async () => {
    const x1 = constrain(Math.min(startPoint[0], mouseX), 0, width) / currentScale;
    const y1 = constrain(Math.min(startPoint[1], mouseY), 0, height) / currentScale;
    const x2 = constrain(Math.max(startPoint[0], mouseX), 0, width) / currentScale;
    const y2 = constrain(Math.max(startPoint[1], mouseY), 0, height) / currentScale;

    if (x2 - x1 < 2 || y2 - y1 < 2) return;

    embedStatus.textContent = "⏳ segmenting…";
    try {
        const res = await fetch(`${API_BACKEND}/get-sticker-blur`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ box: { x1, y1, x2, y2 } }),
        });
        const data = await res.json();
        if (!data.success) { embedStatus.textContent = `❌ ${data.error}`; return; }

        const bgBlob = await fetch(data.background).then((r) => r.blob());
        currentBitmap?.close();
        currentBitmap = null;
        currentBitmap = await createImageBitmap(bgBlob, { resizeWidth: width, resizeHeight: height });
        embedStatus.textContent = "✅ segmented";
    } catch (err: any) {
        embedStatus.textContent = `❌ ${err.message}`;
    }
};

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

    embedStatus.textContent = "⏳ embedding…";
    const form = new FormData();
    form.append("image", blob, "image.png");
    fetch(`${API_BACKEND}/embed`, { method: "POST", body: form })
        .then((r) => r.json())
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
