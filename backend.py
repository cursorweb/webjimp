from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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


@app.post("/embed")
async def get_image_embedding(image: UploadFile = File(...)):
    """Encode image into SAM embedding. Call once per image before segmenting."""
    pass


@app.post("/get-sticker-blur")
async def get_sticker_blur(req: MaskRequest):
    """Given a drag rectangle + optional click hints, return sticker, and the new in-painted background."""
    pass


@app.post("/get-sticker-transparent")
async def get_sticker_transparent(req: MaskRequest):
    """Given a drag rectangle + optional click hints, return sticker, and the new background."""
    pass
