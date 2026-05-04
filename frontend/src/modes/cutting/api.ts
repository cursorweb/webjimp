import type { SnipPayload } from "./SnipEditor";

export const API_BACKEND = "http://127.0.0.1:8000";

export async function embed(blob: Blob): Promise<{ success: boolean; error?: string }> {
    const form = new FormData();
    form.append("image", blob, "image.png");
    const res = await fetch(`${API_BACKEND}/embed`, { method: "POST", body: form });
    return res.json();
}

export interface SegmentResult {
    success: boolean;
    sticker: string;
    sticker_width: number;
    sticker_height: number;
    error?: string;
}

export async function segment(snip: SnipPayload): Promise<SegmentResult> {
    const res = await fetch(`${API_BACKEND}/get-sticker-transparent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snip),
    });
    return res.json();
}
