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

function onCanvas() {
    return mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
}

window.mousePressed = () => {
    if (onCanvas()) {
        app.active.mousePressed();
    }
};

window.mouseDragged = () => {
    if (onCanvas()) {
        app.active.mouseDragged();
    }
};

window.mouseReleased = () => app.active.mouseReleased();
