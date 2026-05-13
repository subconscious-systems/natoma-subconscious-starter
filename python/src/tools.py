"""Custom tools registered alongside MCP-discovered ones."""
import base64
from pathlib import Path

from langchain_core.messages import ToolMessage
from langchain_core.tools import tool

IMAGES_DIR = Path(__file__).resolve().parent.parent / "images"

_EXT_TO_MIME = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
}


def _read_b64(path: Path) -> tuple[str, str]:
    """Read an image file and return (mime, base64_data)."""
    data = path.read_bytes()
    if data[:8] == b'\x89PNG\r\n\x1a\n':
        mime = "image/png"
    elif data[:3] == b'\xff\xd8\xff':
        mime = "image/jpeg"
    elif data[:6] in (b'GIF87a', b'GIF89a'):
        mime = "image/gif"
    elif len(data) >= 12 and data[:4] == b'RIFF' and data[8:12] == b'WEBP':
        mime = "image/webp"
    else:
        mime = _EXT_TO_MIME.get(path.suffix.lower(), "image/png")
    return mime, base64.b64encode(data).decode("ascii")


def _data_uri(path: Path) -> str:
    mime, b64 = _read_b64(path)
    return f"data:{mime};base64,{b64}"


@tool
def sample_image() -> str:
    """Return a sample image for multimodal testing. Call this tool whenever
    the user asks to see a sample image or wants to test image handling."""
    images = sorted(IMAGES_DIR.glob("*"))
    images = [p for p in images if p.suffix.lower() in _EXT_TO_MIME]
    if not images:
        return "No images found in the images/ directory."

    content: list[dict] = [{"type": "text", "text": "Sample image captured."}]
    for i, p in enumerate(images):
        uri = _data_uri(p)
        if i % 2 == 0:
            content.append({
                "type": "image_url",
                "image_url": {"url": uri},
            })
        else:
            content.append({
                "type": "input_image",
                "image_url": uri,
            })
        content.append({"type": "text", "text": f"Image {i + 1} attached."})
    return content


def get_custom_tools() -> list:
    """Return all custom (non-MCP) tools to register with the agent."""
    return [sample_image]
