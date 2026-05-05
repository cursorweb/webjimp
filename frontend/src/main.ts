import "p5";
import { AppState } from "./AppState";

let app: AppState;

window.setup = () => {
    const canvas = createCanvas(800, 600).parent("canvas-container");
    app = new AppState();
    canvas.elt.addEventListener("contextmenu", e => {
        e.preventDefault();
    });
};

window.draw = () => {
    background(0);
    app.active.draw();
};

function inCanvas() {
    return mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
}

window.mousePressed = () => {
    if (inCanvas()) {
        app.active.mousePressed();
    }
};

window.mouseDragged = () => {
    if (inCanvas()) {
        app.active.mouseDragged();
    }
};

window.mouseReleased = () => {
    if (inCanvas()) {
        app.active.mouseReleased();
    }
};