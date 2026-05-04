export class Sticker {
    public width: number = 0;
    public height: number = 0;
    public rotation: number = 0;
    public opacity: number = 1;

    constructor(public x: number, public y: number, public data: ImageBitmap) {
        this.width = data.width;
        this.height = data.height;
    }

    move(dx: number, dy: number): void {
        this.x += dx;
        this.y += dy;
    }

    rotate(angle: number): void {
        this.rotation = angle;
    }

    draw(): void {
        const ctx = drawingContext as CanvasRenderingContext2D;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        ctx.drawImage(this.data, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
    }
}