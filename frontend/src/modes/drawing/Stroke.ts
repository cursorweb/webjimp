export class Stroke {
    points: [number, number][] = [];
    constructor(public color: p5.Color, public weight = 2) { }

    draw() {
        stroke(this.color);
        strokeWeight(this.weight);

        if (this.points.length == 1) {
            const [x, y] = this.points[0];
            noFill();
            point(x, y);
            return;
        }

        noFill();
        beginShape();
        for (const [x, y] of this.points) {
            vertex(x, y);
        }
        endShape();
    }
}