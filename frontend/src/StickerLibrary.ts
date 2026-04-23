export class StickerLibrary {
    stickerData: ImageBitmap[] = [];

    constructor() { }

    addSticker(data: ImageBitmap) {
        this.stickerData.push(data);
    }

    dispose() {
        for (const data of this.stickerData) {
            data.close();
        }
    }
}