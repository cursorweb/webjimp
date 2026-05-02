import { Layer } from "./Layer";

export class LayerManager {
    layers: Layer[] = [new Layer()];
    activeLayer = 0;

    private layerBtns: HTMLButtonElement[] = [];
    private layersEl = document.querySelector<HTMLDivElement>(".layers")!;
    private addLayerBtn = document.querySelector<HTMLButtonElement>(".addlayer-btn")!;

    constructor() {
        this.addLayerUI(0);
        this.addLayerBtn.addEventListener("click", () => this.addLayer());
    }

    private addLayer() {
        this.layers.push(new Layer());
        this.addLayerUI(this.layers.length - 1);
    }

    private addLayerUI(index: number) {
        const btn = document.createElement("button");
        btn.textContent = `Layer ${index + 1}`;
        btn.addEventListener("click", () => this.setActiveLayer(index));
        this.layersEl.appendChild(btn);
        this.layerBtns.push(btn);
        this.setActiveLayer(index);
    }

    setActiveLayer(index: number) {
        this.activeLayer = index;
        this.layerBtns.forEach((btn, i) => btn.disabled = i == index);
    }

    getActiveLayer() {
        return this.layers[this.activeLayer];
    }
}
