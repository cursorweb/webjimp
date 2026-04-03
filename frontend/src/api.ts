import type { Snip } from "./Snipping";

export const API_BACKEND = "http://127.0.0.1:8000";

export async function embed(blob: Blob): Promise<{ success: boolean; error?: string }> {
    const form = new FormData();
    form.append("image", blob, "image.png");
    const res = await fetch(`${API_BACKEND}/embed`, { method: "POST", body: form });
    return res.json();
}

export interface StickerBlurResult {
    success: boolean;
    background: string;
    sticker: string;
    sticker_width: number;
    sticker_height: number;
    error?: string;
}

export async function getStickerBlur(snip: Snip): Promise<StickerBlurResult> {
    const res = await fetch(`${API_BACKEND}/get-sticker-blur`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ box: snip.box, points: snip.points }),
    });
    return res.json();
}


export async function getStickerNoBlur(snip: Snip): Promise<StickerBlurResult> {
    const res = await fetch(`${API_BACKEND}/get-sticker-transparent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ box: snip.box, points: snip.points }),
    });
    return res.json();
}