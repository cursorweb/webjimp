export interface LibraryEntry {
    dataURL: string;
    bitmap: ImageBitmap;
}

export class StickerLibrary {
    private entries: LibraryEntry[] = [];
    private panelEl = document.querySelector<HTMLDivElement>(".sticker-library")!;

    onPlace: ((entry: LibraryEntry) => void) | null = null;

    add(dataURL: string, bitmap: ImageBitmap): void {
        this.entries.push({ dataURL, bitmap });
        this.render();
    }

    private render(): void {
        this.panelEl.innerHTML = "";
        for (const entry of this.entries) {
            const img = document.createElement("img");
            img.src = entry.dataURL;
            img.addEventListener("click", () => this.onPlace?.(entry));
            this.panelEl.appendChild(img);
        }
    }
}
