import "p5";
import { AppState } from "./AppState";

let app: AppState;

window.setup = () => {
    createCanvas(800, 600).parent("canvas-container");
    app = new AppState();
};

window.draw = () => {
    background(0);
    app.active.draw();
};

window.mousePressed = () => app.active.mousePressed();
window.mouseDragged = () => app.active.mouseDragged();
window.mouseReleased = () => app.active.mouseReleased();
