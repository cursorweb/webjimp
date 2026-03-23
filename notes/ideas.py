"""
Three approaches for handling per-user SAM2 predictors.
"""

import asyncio
import uuid
import numpy as np
import torch
from PIL import Image
import io
from fastapi import FastAPI, UploadFile, File
from sam2.build_sam import build_sam2
from sam2.sam2_image_predictor import SAM2ImagePredictor

SAM2_CHECKPOINT = "./checkpoints/sam2.1_hiera_tiny.pt"
MODEL_CFG = "configs/sam2.1/sam2.1_hiera_t.yaml"

# ─────────────────────────────────────────────────────────────────────────────
# OPTION 1: Cache embeddings per session (recommended)
#
# - One shared model + predictor on GPU
# - /embed stores the image embedding in a dict keyed by session_id
# - /predict restores the cached embedding before running inference
# - asyncio.Lock serializes GPU access (only one call at a time)
# ─────────────────────────────────────────────────────────────────────────────

app1 = FastAPI()

sam2_model_1 = build_sam2(MODEL_CFG, SAM2_CHECKPOINT, device="cuda")
predictor_1 = SAM2ImagePredictor(sam2_model_1)
gpu_lock_1 = asyncio.Lock()

# session_id -> image embedding tensor
embedding_cache: dict[str, torch.Tensor] = {}


@app1.post("/embed")
async def embed_option1(image: UploadFile = File(...)):
    data = await image.read()
    img = np.array(Image.open(io.BytesIO(data)).convert("RGB"))
    session_id = str(uuid.uuid4())

    async with gpu_lock_1:
        predictor_1.set_image(img)
        embedding_cache[session_id] = predictor_1.get_image_embedding()

    return {"session_id": session_id}


@app1.post("/predict/{session_id}")
async def predict_option1(session_id: str, x: float, y: float):
    if session_id not in embedding_cache:
        return {"error": "session not found, call /embed first"}

    async with gpu_lock_1:
        # Restore this user's embedding without re-encoding the image
        predictor_1._features = embedding_cache[session_id]
        masks, scores, _ = predictor_1.predict(
            point_coords=np.array([[x, y]]),
            point_labels=np.array([1]),
        )

    return {"mask": masks[int(scores.argmax())].tolist()}


# ─────────────────────────────────────────────────────────────────────────────
# OPTION 2: New SAM2ImagePredictor per request
#
# - One shared sam2_model (the heavy part, stays on GPU)
# - Each request creates a fresh SAM2ImagePredictor wrapper (lightweight)
# - No caching: image is re-encoded on every /predict call
# - Simple but expensive for multi-click workflows
# ─────────────────────────────────────────────────────────────────────────────

app2 = FastAPI()

sam2_model_2 = build_sam2(MODEL_CFG, SAM2_CHECKPOINT, device="cuda")
gpu_lock_2 = asyncio.Lock()


@app2.post("/predict")
async def predict_option2(image: UploadFile = File(...), x: float = 0, y: float = 0):
    data = await image.read()
    img = np.array(Image.open(io.BytesIO(data)).convert("RGB"))

    async with gpu_lock_2:
        predictor = SAM2ImagePredictor(sam2_model_2)  # fresh wrapper, shared model
        predictor.set_image(img)
        masks, scores, _ = predictor.predict(
            point_coords=np.array([[x, y]]),
            point_labels=np.array([1]),
        )

    return {"mask": masks[int(scores.argmax())].tolist()}


# ─────────────────────────────────────────────────────────────────────────────
# OPTION 3: Pool of predictors with per-predictor locks
#
# - N predictors are created upfront, each with its own lock
# - A request acquires the first available predictor
# - Better throughput if you have multiple GPUs or want to pipeline CPU/GPU work
# - More complex; overkill for a single Colab GPU
# ─────────────────────────────────────────────────────────────────────────────

app3 = FastAPI()

POOL_SIZE = 2  # increase if you have multiple GPUs

sam2_model_3 = build_sam2(MODEL_CFG, SAM2_CHECKPOINT, device="cuda")

predictor_pool: list[tuple[SAM2ImagePredictor, asyncio.Lock]] = [
    (SAM2ImagePredictor(sam2_model_3), asyncio.Lock())
    for _ in range(POOL_SIZE)
]

# session_id -> (embedding tensor, predictor index)
pool_embedding_cache: dict[str, tuple[torch.Tensor, int]] = {}


async def acquire_predictor() -> tuple[int, SAM2ImagePredictor, asyncio.Lock]:
    """Wait for any free predictor in the pool."""
    while True:
        for i, (pred, lock) in enumerate(predictor_pool):
            if not lock.locked():
                return i, pred, lock
        await asyncio.sleep(0.01)


@app3.post("/embed")
async def embed_option3(image: UploadFile = File(...)):
    data = await image.read()
    img = np.array(Image.open(io.BytesIO(data)).convert("RGB"))
    session_id = str(uuid.uuid4())

    idx, pred, lock = await acquire_predictor()
    async with lock:
        pred.set_image(img)
        pool_embedding_cache[session_id] = (pred.get_image_embedding(), idx)

    return {"session_id": session_id}


@app3.post("/predict/{session_id}")
async def predict_option3(session_id: str, x: float, y: float):
    if session_id not in pool_embedding_cache:
        return {"error": "session not found"}

    embedding, preferred_idx = pool_embedding_cache[session_id]
    pred, lock = predictor_pool[preferred_idx]

    async with lock:
        pred._features = embedding
        masks, scores, _ = pred.predict(
            point_coords=np.array([[x, y]]),
            point_labels=np.array([1]),
        )

    return {"mask": masks[int(scores.argmax())].tolist()}
