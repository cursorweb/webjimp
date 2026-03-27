import base64

import cv2
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# GET DEVICE
import numpy as np
import torch
from PIL import Image

# select the device for computation
if torch.cuda.is_available():
    device = torch.device("cuda")
elif torch.backends.mps.is_available():
    device = torch.device("mps")
else:
    device = torch.device("cpu")
print(f"using device: {device}")

if device.type == "cuda":
    # use bfloat16 for the entire notebook
    torch.autocast("cuda", dtype=torch.bfloat16).__enter__()
    # turn on tfloat32 for Ampere GPUs (https://pytorch.org/docs/stable/notes/cuda.html#tensorfloat-32-tf32-on-ampere-devices)
    if torch.cuda.get_device_properties(0).major >= 8:
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.backends.cudnn.allow_tf32 = True
elif device.type == "mps":
    print(
        "\nSupport for MPS devices is preliminary. SAM 2 is trained with CUDA and might "
        "give numerically different outputs and sometimes degraded performance on MPS. "
        "See e.g. https://github.com/pytorch/pytorch/issues/84936 for a discussion."
    )

torch.inference_mode().__enter__()

from sam2.build_sam import build_sam2
from sam2.sam2_image_predictor import SAM2ImagePredictor

sam2_checkpoint = "./checkpoints/sam2.1_hiera_tiny.pt"
model_cfg = "configs/sam2.1/sam2.1_hiera_t.yaml"

sam2_model = build_sam2(model_cfg, sam2_checkpoint, device=device)

predictor = SAM2ImagePredictor(sam2_model)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ClickPoint(BaseModel):
    x: float
    y: float
    foreground: bool


class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class MaskRequest(BaseModel):
    box: BoundingBox
    points: list[ClickPoint] = []  # optional foreground/background hints


img_rgb = None


@app.post("/embed")
async def get_image_embedding(image: UploadFile = File(...)):
    global img_rgb
    """Encode image into SAM embedding. Call once per image before segmenting."""

    try:
        # Read image file
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Convert BGR to RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Set image in predictor (this encodes it)
        with torch.inference_mode():
            predictor.set_image(img_rgb)

        # Return success with image info
        return {
            "success": True,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/get-sticker-blur")
async def get_sticker_blur(req: MaskRequest):
    """Given a drag rectangle + optional click hints, return sticker, and the new in-painted background."""
    try:
        global img_rgb

        if img_rgb is None:
            return {
                "success": False,
                "error": "No image embedded yet. Call /embed first.",
            }

        box = np.array([req.box.x1, req.box.y1, req.box.x2, req.box.y2])

        point_coords = None
        point_labels = None
        if req.points:
            point_coords = np.array([[p.x, p.y] for p in req.points])
            point_labels = np.array([1 if p.foreground else 0 for p in req.points])

        with torch.inference_mode():
            masks, _, _ = predictor.predict(
                point_coords=point_coords,
                point_labels=point_labels,
                box=box[None, :],
                multimask_output=False,
            )

        mask = masks[0]
        mask_uint8 = mask.astype(np.uint8) * 255

        # --- Background: inpaint then blur the masked region ---
        image_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
        inpainted = cv2.inpaint(image_bgr, mask_uint8, 5, cv2.INPAINT_TELEA)
        blurred = cv2.GaussianBlur(inpainted, (101, 101), 0)
        result = image_bgr.copy()
        result[mask_uint8 == 255] = blurred[mask_uint8 == 255]
        bg_rgb = cv2.cvtColor(result, cv2.COLOR_BGR2RGB)

        # --- Sticker: tightly cropped with transparency ---
        rows = np.any(mask, axis=1)
        cols = np.any(mask, axis=0)
        rmin, rmax = np.where(rows)[0][[0, -1]]
        cmin, cmax = np.where(cols)[0][[0, -1]]

        cropped_rgb = img_rgb[rmin : rmax + 1, cmin : cmax + 1]
        cropped_mask = mask[rmin : rmax + 1, cmin : cmax + 1]

        h, w = cropped_rgb.shape[:2]
        sticker = np.zeros((h, w, 4), dtype=np.uint8)
        sticker[..., :3] = cropped_rgb
        sticker[..., 3] = cropped_mask.astype(np.uint8) * 255

        _, bg_buffer = cv2.imencode(".png", cv2.cvtColor(bg_rgb, cv2.COLOR_RGB2BGR))
        bg_base64 = base64.b64encode(bg_buffer).decode()

        _, sticker_buffer = cv2.imencode(
            ".png", cv2.cvtColor(sticker, cv2.COLOR_RGBA2BGRA)
        )
        sticker_base64 = base64.b64encode(sticker_buffer).decode()

        return {
            "success": True,
            "background": f"data:image/png;base64,{bg_base64}",
            "sticker": f"data:image/png;base64,{sticker_base64}",
            "sticker_width": w,
            "sticker_height": h,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/get-sticker-transparent")
async def get_sticker_transparent(req: MaskRequest):
    """Given a bounding box + optional click hints, return sticker and background."""

    try:
        global img_rgb

        if img_rgb is None:
            return {
                "success": False,
                "error": "No image embedded yet. Call /embed first.",
            }

        # Extract bounding box
        box = np.array([req.box.x1, req.box.y1, req.box.x2, req.box.y2])

        # Prepare point prompts if provided
        point_coords = None
        point_labels = None

        if req.points:
            point_coords = np.array([[p.x, p.y] for p in req.points])
            point_labels = np.array([1 if p.foreground else 0 for p in req.points])

        # Segment with SAM2
        with torch.inference_mode():
            masks, _, _ = predictor.predict(
                point_coords=point_coords,
                point_labels=point_labels,
                box=box[None, :],
                multimask_output=False,
            )

        mask = masks[0]

        # --- Background with mask removed (transparent) ---
        bg = np.dstack(
            [
                img_rgb,
                np.ones((img_rgb.shape[0], img_rgb.shape[1]), dtype=np.uint8) * 255,
            ]
        )
        bg[mask == 1, 3] = 0

        # --- Sticker, tightly cropped with transparency ---
        rows = np.any(mask, axis=1)
        cols = np.any(mask, axis=0)
        rmin, rmax = np.where(rows)[0][[0, -1]]
        cmin, cmax = np.where(cols)[0][[0, -1]]

        cropped_rgb = img_rgb[rmin : rmax + 1, cmin : cmax + 1]
        cropped_mask = mask[rmin : rmax + 1, cmin : cmax + 1]

        # Create RGBA sticker
        h, w = cropped_rgb.shape[:2]
        sticker = np.zeros((h, w, 4), dtype=np.uint8)
        sticker[..., :3] = cropped_rgb
        sticker[..., 3] = cropped_mask.astype(np.uint8) * 255

        # Convert to base64
        _, bg_buffer = cv2.imencode(".png", cv2.cvtColor(bg, cv2.COLOR_RGBA2BGRA))
        bg_base64 = base64.b64encode(bg_buffer).decode()

        _, sticker_buffer = cv2.imencode(
            ".png", cv2.cvtColor(sticker, cv2.COLOR_RGBA2BGRA)
        )
        sticker_base64 = base64.b64encode(sticker_buffer).decode()

        return {
            "success": True,
            "background": f"data:image/png;base64,{bg_base64}",
            "sticker": f"data:image/png;base64,{sticker_base64}",
            "sticker_width": w,
            "sticker_height": h,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}
