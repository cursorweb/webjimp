import requests
import json
from PIL import Image
import io
import base64

BASE_URL = "http://127.0.0.1:8000"

# Test image path
TEST_IMAGE_PATH = "notes/example.png"


def test_embed():
    """Test the /embed endpoint"""
    print("\n=== Testing /embed ===")

    with open(TEST_IMAGE_PATH, "rb") as f:
        files = {"image": f}
        response = requests.post(f"{BASE_URL}/embed", files=files)

    data = response.json()
    print(f"Status: {data}")

    return True  # /embed just returns success


def test_sticker_no_points():
    """Test /get-sticker-transparent with just bounding box"""
    print("\n=== Testing /get-sticker-transparent (Box only) ===")

    payload = {"box": {"x1": 300, "y1": 80, "x2": 800, "y2": 700}, "points": []}

    response = requests.post(
        f"{BASE_URL}/get-sticker-transparent",
        headers={"Content-Type": "application/json"},
        json=payload,
    )

    data = response.json()
    print(f"Response: {data}")

    if data.get("success"):
        print(f"✓ Segmentation successful")
        print(f"Mask score: {data['mask_score']:.2f}")
        print(f"Sticker size: {data['sticker_width']}x{data['sticker_height']}")
        print(f"Masked pixels: {data['masked_pixels']}")

        # Save results
        save_base64_image(data["background"], "output_background.png")
        save_base64_image(data["sticker"], "output_sticker.png")
        print("✓ Saved: output_background.png, output_sticker.png")
    else:
        print(f"✗ Error: {data.get('error')}")

    return data.get("success", False)


def test_sticker_with_points():
    """Test /get-sticker-transparent with bounding box + click hints"""
    print("\n=== Testing /get-sticker-transparent (Box + Points) ===")

    payload = {
        "box": {"x1": 300, "y1": 80, "x2": 800, "y2": 700},
        "points": [
            {"x": 550, "y": 400, "foreground": True},  # Click in object
            {"x": 310, "y": 90, "foreground": False},  # Click in background
        ],
    }

    response = requests.post(
        f"{BASE_URL}/get-sticker-transparent",
        headers={"Content-Type": "application/json"},
        json=payload,
    )

    data = response.json()
    print(f"Response: {data}")

    if data.get("success"):
        print(f"✓ Segmentation successful (with hints)")
        print(f"Mask score: {data['mask_score']:.2f}")
        print(f"Sticker size: {data['sticker_width']}x{data['sticker_height']}")
        print(f"Masked pixels: {data['masked_pixels']}")

        # Save results
        save_base64_image(data["background"], "output_background_with_hints.png")
        save_base64_image(data["sticker"], "output_sticker_with_hints.png")
        print(
            "✓ Saved: output_background_with_hints.png, output_sticker_with_hints.png"
        )
    else:
        print(f"✗ Error: {data.get('error')}")

    return data.get("success", False)


def save_base64_image(base64_str, filename):
    """Convert base64 data URI to PNG file"""
    # Remove the data URI prefix
    if base64_str.startswith("data:image/png;base64,"):
        base64_str = base64_str.replace("data:image/png;base64,", "")

    # Decode and save
    img_data = base64.b64decode(base64_str)
    with open(filename, "wb") as f:
        f.write(img_data)
    print(f"Saved: {filename}")


def display_results():
    """Display the output images"""
    print("\n=== Displaying Results ===")

    try:
        import matplotlib.pyplot as plt

        fig, axes = plt.subplots(2, 2, figsize=(12, 10))

        # Load and display results
        bg = Image.open("output_background.png")
        sticker = Image.open("output_sticker.png")
        bg_hints = Image.open("output_background_with_hints.png")
        sticker_hints = Image.open("output_sticker_with_hints.png")

        axes[0, 0].imshow(bg)
        axes[0, 0].set_title("Background (Box only)")
        axes[0, 0].axis("off")

        axes[0, 1].imshow(sticker)
        axes[0, 1].set_title("Sticker (Box only)")
        axes[0, 1].axis("off")

        axes[1, 0].imshow(bg_hints)
        axes[1, 0].set_title("Background (Box + Points)")
        axes[1, 0].axis("off")

        axes[1, 1].imshow(sticker_hints)
        axes[1, 1].set_title("Sticker (Box + Points)")
        axes[1, 1].axis("off")

        plt.tight_layout()
        plt.savefig("comparison.png", dpi=150, bbox_inches="tight")
        plt.show()
        print("✓ Saved: comparison.png")
    except Exception as e:
        print(f"Could not display: {e}")


if __name__ == "__main__":
    print("Starting tests...")

    # Test 1: Embed
    test_embed()

    # Test 2: Box only
    test_sticker_no_points()

    # Test 3: Box + Points
    test_sticker_with_points()

    # Display results
    display_results()

    print("\n✓ All tests completed!")
