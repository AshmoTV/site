"""
One-time migration from the old Mobirise site (website5_0) into this project.

- Copies every media file the old site used into media-src/<folder>/ with clean names
- Writes src/content/projects.json and src/content/gallery.json

After running this, `npm run media` converts media-src -> public/media (GIF -> MP4 etc).
You never need to run this again; edit the JSON files directly from now on.
"""
import json, shutil, sys
from pathlib import Path

OLD = Path(sys.argv[1] if len(sys.argv) > 1 else "../website5_0") / "assets" / "images"
ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "media-src"
CONTENT = ROOT / "src" / "content"

VIDEO_EXT = {".gif", ".mp4", ".mov", ".webm"}


def out_ext(name):
    ext = Path(name).suffix.lower()
    return ".mp4" if ext in VIDEO_EXT else ".jpg"


def take(old_name, folder, new_stem):
    """Copy one old file into media-src and return the path the site will use."""
    src = OLD / old_name
    if not src.exists():
        raise SystemExit(f"missing: {src}")
    dest = SRC / folder / f"{new_stem}{src.suffix.lower()}"
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        shutil.copy2(src, dest)
    return f"{folder}/{new_stem}{out_ext(old_name)}"


def seq(names, folder, prefix=""):
    return [take(n, folder, f"{prefix}{i + 1:02d}") for i, n in enumerate(names)]


def yt(i, caption=None):
    return {"src": f"youtube:{i}", "caption": caption} if caption else f"youtube:{i}"


projects = []

# ---------------------------------------------------------------- AI LAB: LoRAs
f = "lab/embroidery"
projects.append({
    "id": "embroidery-lora",
    "section": "lab", "type": "lora", "featured": True,
    "title": "WAN Embroidery LoRA",
    "summary": "WAN 2.2 LoRAs that simulate knitting and embroidery as a moving, tactile material.",
    "cover": take("wan-00067-hqgif256-420.gif", f, "cover"),
    "caption": "Created using WAN combined with Embroidery LoRA",
    "tools": ["AI Toolkit", "ComfyUI"],
    "models": ["Wan 2.2 (Video)", "Z-Image Turbo (Images)", "Gemini 2.5 (Prompts)"],
    "body": [
        "This project started with an interest in treating embroidery as a moving material rather than a static texture, inspired by various commercials and Houdini simulations.",
        "I trained a custom Embroidery LoRA to capture stitched patterns and thread animations. The goal was to preserve the tactile feel of embroidery while still allowing variation in form, movement, and composition.",
        "The LoRA was integrated in an I2V workflow, combined with Z-Image and an LLM to generate images through to final videos.",
    ],
    "sections": [
        {"title": "Embroidery LoRA — Visual Explorations", "text": "Z-Image + WAN 2.2",
         "media": seq(["wan-00084-hqgif256-420.gif", "wan-00085-hqgif256-420.gif", "wan-00086-hqgif256-420.gif", "wan-00091-hqgif256-420.gif"], f, "emb-")},
        {"title": "Knitting LoRA — Visual Explorations", "text": "Z-Image + WAN 2.2",
         "media": seq(["wan-00135-hqgif256-420.gif", "wan-00143-hqgif256-420.gif", "wan-00139-hqgif256-420.gif", "wan-00149-hqgif256-420.gif"], f, "knit-")},
        {"title": "More explorations", "media": seq(["wan-00087-hqgif256-420.gif", "wan-00093-hqgif256-420.gif"], f, "more-")
            + [take("comfyui-00007-499x312.png", f, "still")]},
    ],
})

f = "lab/liquid-morphing"
projects.append({
    "id": "liquid-morphing-lora",
    "section": "lab", "type": "lora", "featured": True,
    "title": "Seamless Liquid Morphing LoRA",
    "summary": "A WAN 2.2 LoRA trained for continuous motion, smooth transitions and liquid-like deformation.",
    "cover": take("wan22-i2v-native-00001-p85-ozfnp-1761235240-hqgif256-420.gif", f, "cover"),
    "caption": "Created using FFLF WAN combined with Morphing LoRA",
    "tools": ["AI Toolkit", "ComfyUI"],
    "models": ["Wan 2.2 (Video)", "Qwen Image", "Gemini 2.5 / Qwen VL 8B (Prompts)"],
    "body": [
        "This LoRA was inspired by classic hand-drawn morphing sequences, where shapes transform fluidly while maintaining visual continuity.",
        "I set out to capture that feeling with a custom WAN 2.2 LoRA. Trained to emphasize continuous motion, smooth transitions, and liquid-like deformations, this LoRA generates frames that flow seamlessly while preserving visual continuity. The focus is on achieving fluid, intentional motion suitable for motion design.",
    ],
    "sections": [
        {"title": "First–last frame generations", "text": "WAN 2.2 first/last frame workflow combined with the morphing LoRA",
         "media": seq([
             "wan22-i2v-native-00001-p85-pjgaj-1761242961-hqgif256-420.gif",
             "wan22-i2v-native-00006-p81-bqvbs-1761156442-hqgif256-420.gif",
             "wan22-i2v-native-00028-p81-pmyyf-1761161372-hqgif256-420.gif",
             "wan22-i2v-native-00011-p81-mvirl-1761159462-hqgif256-420.gif",
             "wan22-i2v-native-00001-p80-fghup-1761227624-hqgif256-420.gif",
             "wan22-i2v-native-00001-p83-ahpkf-1761233775-hqgif256-420.gif",
             "wan22-i2v-native-00004-p85-hyiay-1761243405-hqgif256-420.gif",
             "wan22-tile-upscaled-00008-p80-nxvzp-1761246713-hqgif256-420.gif",
             "wan22-i2v-native-00026-p81-ytnmk-1761160775-hqgif256-420.gif",
             "wan22-i2v-native-00002-p80-buxhe-1761247722-hqgif256-420.gif",
             "wan22-i2v-native-00001-p82-nznev-1761226655-hqgif256-420.gif",
             "wan22-i2v-native-00002-p82-uhiis-1761228696-hqgif256-420.gif",
         ], f)},
        {"title": "Faces Morphing — liquid motion experiment", "layout": "wide",
         "media": [yt("gh16UOTrW2I", "Generated using first–last frames with WAN 2.2 combined with the morphing LoRA")]},
        {"title": "Stills", "media": [take("liquid-2-596x358.jpeg", f, "still")]},
    ],
})

f = "lab/pencil-sketch"
projects.append({
    "id": "pencil-sketch-lora",
    "section": "lab", "type": "lora", "featured": True,
    "title": "Pencil Sketch Style LoRA",
    "summary": "Hand-drawn pencil shading for WAN 2.2 — cross-hatching and over-drawn pencil stroke animation.",
    "cover": take("wan22-t2v-00007-p86-cizoe-1759430011-hqgif256-420.gif", f, "cover"),
    "caption": "Created using WAN T2V combined with Pencil Sketch LoRA",
    "tools": ["AI Toolkit", "ComfyUI"],
    "models": ["Wan 2.2 (Video)"],
    "body": [
        "This project grew out of a desire to recreate the imperfections and warmth of hand-drawn pencil animation, particularly the style from the award-winning short film [Dear Basketball](https://youtu.be/lUcdx4W8Xes), using generative tools.",
        "A custom LoRA was trained to capture pencil sketch-like line quality, cross-hatching texture and shading variation. The main challenge was avoiding overly clean or “digital” results, while still keeping enough consistency for motion.",
    ],
    "sections": [
        {"title": "Winter Hunt — Pencil LoRA exploration", "layout": "wide",
         "media": [yt("9qBBegC7ygI", "Generated using Text2Video WAN 2.2 with the Pencil Sketch LoRA")]},
        {"title": "Examples generated with T2V WAN 2.2", "text": "Pencil Sketch LoRA",
         "media": seq([
             "wan22-t2v-00003-p82-yhnin-1761897955-hqgif256-420.gif",
             "wan22-t2v-00005-p86-cqycx-1759344897-hqgif256-420.gif",
             "wan22-t2v-00002-p82-rnpkx-1761897703-hqgif256-420.gif",
             "wan22-t2v-00001-p80-beugg-1759326264-hqgif256-420.gif",
             "wan22-t2v-00001-p86-irhfo-1759428486-hqgif256-420.gif",
             "wan22-t2v-00001-p87-oqzty-1759326930-hqgif256-420.gif",
             "wan22-t2v-00002-p83-cayba-1761470626-hqgif256-420.gif",
             "wan22-t2v-00001-p86-ybpkd-1759343615-hqgif256-420.gif",
             "wan22-t2v-00001-p86-yecdj-1759341916-hqgif256-420.gif",
             "wan22-t2v-00001-p86-izqfr-1759308383-hqgif256-420.gif",
             "wan22-t2v-00002-p86-qmcnk-1763140089-hqgif256-420.gif",
         ], f)},
        {"title": "Stills", "media": [
            take("wan22-t2v-00007-p86-cizoe-1759430011.mp4-snapshot-00.04.064-499x281.jpeg", f, "still-01"),
            take("wan22-t2v-00007-p86-cizoe-1759430011.mp4-snapshot-00.04.064-2-499x281.jpeg", f, "still-02"),
        ]},
    ],
})

f = "lab/qwen-restyle"
projects.append({
    "id": "qwen-restyle-lora",
    "section": "lab", "type": "lora", "featured": True,
    "title": "Qwen Edit 2D Restyle LoRA",
    "summary": "Transfers character features and visual style from a reference image — for consistent storyboards and animation-ready assets.",
    "cover": take("comfyui-00811-1256x700.png", f, "cover"),
    "caption": "Created using Qwen Image Edit combined with a custom LoRA",
    "tools": ["AI Toolkit", "ComfyUI", "Custom Python app"],
    "models": ["Qwen Image Edit", "Gemini 2.5 (Prompts)", "Gemini + Claude (Python app dev)"],
    "body": [
        "This project came out of a need for translating written scripts into visually consistent storyboards and animation-ready assets.",
        "I trained a LoRA to transfer character features and overall visual style from single or multiple reference images, enabling consistent character representation and visual style across multiple storyboard frames. This approach allows rapid iteration while maintaining visual continuity throughout the frames.",
        "The generated images were then processed through a custom Python-based web app to convert them into clean, editable SVG files, making them directly usable within Illustrator and downstream animation pipelines.",
    ],
    "sections": [
        {"title": "Reference → generated", "text": "The first frame is the reference image; the rest are generated with the Restyle LoRA",
         "media": [{"src": take("reference20image-886x526.jpg", f, "reference"), "caption": "Reference image"}] + [
             {"src": p, "caption": "Generated"} for p in seq([
                 "comfyui-00589-jpeg10-1-886x502.jpg", "comfyui-00585-jpeg10-1-886x502.jpg", "comfyui-00586-jpeg10-1-886x502.jpg",
                 "comfyui-00583-jpeg10-1-1920x1088.jpg", "comfyui-00584-jpeg10-1-1920x1088.jpg",
                 "comfyui-00582-jpeg10-1-1920x1088.jpg", "comfyui-00588-jpeg10-1-1920x1088.jpg"], f, "gen-")]},
        {"title": "Comparison", "layout": "stack",
         "media": seq([
             "comfyui-00783-jpeg10-1-3546x840.jpg", "comfyui-00790-jpeg10-1-3546x840.jpg", "comfyui-00791-jpeg10-1-3546x840.jpg",
             "comfyui-00799-jpeg10-1-3546x694.jpg", "comfyui-00794-jpeg10-1-3546x694.jpg",
             "comfyui-00798-jpeg10-1-3546x694.jpg", "comfyui-00802-jpeg10-1-3546x694.jpg"], f, "compare-")},
        {"title": "Stills", "media": [take("comfyui-00746-1-499x278.png", f, "still")]},
    ],
})

for pid, title, summary, img, ytid in [
    ("style-3d-animated", "3D Animated Style LoRA", "Captures a 3D animated look with painterly brush textures.", "animated-1000x563.jpg", "qjirSxuAvmc"),
    ("style-comic", "Comic Style LoRA", "Expressive, comic-inspired illustration — exaggerated animation, flat 2D shading, an emphasis on character and expression.", "comic-1000x563.jpg", "4vU6DYeGUfk"),
    ("style-half-illustration", "Half Illustration Style LoRA", "2D illustration overlaid on cinematic realism — a look that is extremely hard to accomplish with default models.", "half-1000x567.jpg", "7nM4BsAmdxA"),
]:
    projects.append({
        "id": pid, "section": "lab", "type": "lora",
        "title": title, "summary": summary,
        "cover": take(img, "lab/style-loras", pid),
        "models": ["Wan 2.2 (Video)"],
        "body": ["Part of a set of trained style LoRAs for WAN.", summary],
        "sections": [{"title": "Sample", "layout": "wide", "media": [yt(ytid)]}],
    })

projects.append({
    "id": "effect-loras",
    "section": "lab", "type": "lora", "featured": True,
    "title": "Transitions & Effects LoRAs",
    "summary": "A growing collection of WAN LoRAs built specifically for motion transitions and effects.",
    "cover": "youtube:U3Q0to0uVso",
    "models": ["Wan 2.2 (Video)"],
    "links": [
        {"label": "Exploded effect LoRA on Hugging Face", "url": "https://huggingface.co/Ashmotv/exploded_effect_wan"},
        {"label": "Water morphing LoRA on Hugging Face", "url": "https://huggingface.co/Ashmotv/water_morping_wan"},
    ],
    "body": ["A growing collection of LoRAs built specifically for motion transitions and effects: exploded, water morphing, mechanical and glitch transformations, inflate, ripple wave, and a 360° camera rotation LoRA."],
    "sections": [
        {"title": "Exploded effect LoRA", "layout": "wide", "media": [yt("U3Q0to0uVso")]},
        {"title": "Water morphing effect LoRA", "layout": "wide", "media": [yt("9j0EosEug54")]},
        {"title": "Mechanical & glitch transformation LoRAs", "layout": "wide", "media": [yt("-akjx2tQcjo")]},
        {"title": "Inflate & ripple wave effect LoRAs", "layout": "wide", "media": [yt("yhH46-wU7Xg")]},
        {"title": "360° camera rotation LoRA", "text": "Trained for WAN 2.2. Samples generated using one input image each.", "layout": "wide", "media": [yt("0sQh0kbhd6Q")]},
    ],
})

f = "lab/qwen-loras"
projects.append({
    "id": "qwen-loras",
    "section": "lab", "type": "lora",
    "title": "Qwen Image LoRAs",
    "summary": "Inside View and Cutout Collage — image LoRAs trained for Qwen.",
    "cover": take("comfyui-00397-jpeg10-1-596x834.jpg", f, "cover"),
    "tools": ["AI Toolkit", "ComfyUI"], "models": ["Qwen Image"],
    "body": ["Image LoRAs trained for Qwen, exploring distinctive editorial looks."],
    "sections": [
        {"title": "Inside View LoRA", "media": seq(["873d6c0d-766a-4c93-87bf-04032582af9a-596x749.jpg", "comfyui-00364-jpeg10-1-596x795.jpg", "comfyui-00279-jpeg10-1-596x426.jpg", "comfyui-00300-jpeg10-1-596x426.jpeg"], f, "inside-")},
        {"title": "Cutout Collage LoRA", "media": seq(["comfyui-00411-jpeg10-1-596x795.jpg", "comfyui-00379-jpeg10-1-596x834.jpg", "comfyui-00426-jpeg10-1-596x795.jpg"], f, "collage-")},
    ],
})

f = "lab/flux-loras"
projects.append({
    "id": "flux-loras",
    "section": "lab", "type": "lora",
    "title": "Flux LoRAs",
    "summary": "Image LoRAs trained for Flux, with LTX for animated tests.",
    "cover": take("flux-image-00114-1024x1024.png", f, "cover"),
    "tools": ["ComfyUI"], "models": ["Flux", "LTX (video)"],
    "body": ["LoRAs trained for Flux, with LTX used to bring selected stills into motion."],
    "sections": [{"title": "Samples", "media": seq(["comfyui-01421-886x886.png", "ltxv-00008-hqgif256-420.gif", "flux-image-00068-886x886.png", "condelta-image-00372-886x886.png", "flux-image-00107-1024x1024.png", "ltxv-00047-hqgif256-420.gif", "ltxv-00068-hqgif256-420.gif"], f)}],
})

# ---------------------------------------------------------- AI LAB: Explorations
projects.append({
    "id": "looping-explorations",
    "section": "lab", "type": "exploration", "featured": True,
    "title": "Looping Explorations",
    "summary": "Seamless high-resolution loops grown from a single starting image.",
    "cover": "youtube:X-SNISjah5M",
    "tools": ["ComfyUI", "After Effects"], "models": ["Qwen Image Edit", "WAN 2.2", "VACE"],
    "body": [
        "A series of looping animations developed from a single starting image. The process explores how generative image editing, multi-stage animation, and traditional compositing can be combined into a controllable, repeatable workflow.",
        "Keyframes were generated using Qwen image-edit models, expanded into sequential animations, assembled in After Effects, and refined through temporal cleanup and upscaling passes to produce seamless high-resolution loops.",
    ],
    "sections": [{"title": "The loops", "layout": "shorts", "media": [
        yt("X-SNISjah5M", "Day in the life"), yt("SkqlpbB_n48", "Around the World"),
        yt("eGJhgf-BKBA", "Bounce"), yt("kHGgpjD2I18", "Textures")]}],
})

f = "lab/product"
projects.append({
    "id": "product-explorations",
    "section": "lab", "type": "exploration",
    "title": "Product Explorations",
    "summary": "Visual explorations for product animation using WAN 2.2.",
    "cover": take("wan22-i2v-native-00001-gjpnp-1754809403-hqgif256-420.gif", f, "cover"),
    "tools": ["ComfyUI", "After Effects"], "models": ["WAN 2.2"],
    "body": ["Visual explorations for product animations using WAN 2.2."],
    "sections": [{"title": "Explorations", "media": seq(["wan22-i2v-native-00001-lguhs-1754561301-hqgif256-420.gif", "wan22-i2v-native-00002-zcbbm-1754671412-hqgif256-420.gif", "wan22-i2v-native-00001-p82-pnzup-1758641016-hqgif256-420.gif"], f)}],
})

f = "lab/visual"
projects.append({
    "id": "visual-explorations",
    "section": "lab", "type": "exploration",
    "title": "Visual Explorations",
    "summary": "Abstract studies built with WAN, Qwen and custom LoRAs.",
    "cover": take("wan22-i2v-native-00001-hqgif256-420.gif", f, "cover"),
    "tools": ["ComfyUI"], "models": ["WAN", "Qwen Image", "Qwen Edit", "Custom LoRAs"],
    "body": ["Abstract visual studies and system-based experiments, built through multi-stage generative workflows."],
    "sections": [{"title": "Studies", "media": seq([
        "animatediff-00001-p87-mqtcg-1766570120-hqgif256-420.gif", "wan22-i2v-native-00002-hqgif256-420.gif",
        "wan22-i2v-native-00002-p82-zjgst-1757268769-hqgif256-420.gif", "wan-00178-hqgif256-420.gif",
        "wan22-i2v-native-00002-pduxx-1754459936-hqgif32-320.gif", "wan22-tile-upscaled-00001-p80-trcnj-1758121977-hqgif256-420.gif",
        "wan22-i2v-native-00001-p80-rvqem-1758188466-hqgif256-420.gif"], f)}],
})

f = "lab/uni3c"
projects.append({
    "id": "uni3c-camera-transfer",
    "section": "lab", "type": "exploration",
    "title": "Camera Movement Transfer",
    "summary": "Transferring camera motion between shots using Uni3C.",
    "cover": take("wanvideowrapper-i2v-00148-hqgif32-320.gif", f, "cover"),
    "tools": ["ComfyUI"], "models": ["WAN", "Uni3C"],
    "body": ["Camera movement transfer experiments using Uni3C."],
    "sections": [{"title": "Tests", "media": seq(["wanvideowrapper-i2v-00171-hqgif32-320.gif", "wanvideowrapper-i2v-00172-hqgif32-320.gif", "wanvideowrapper-i2v-00114-hqgif32-320.gif"], f)}],
})

f = "lab/sdxl-style"
projects.append({
    "id": "sdxl-style-transfer",
    "section": "lab", "type": "experiment",
    "title": "SDXL Style Transfer",
    "summary": "One image, many media — style transfer explorations with SDXL and IP-Adapter.",
    "cover": take("comfyui-01140-1152x1152.png", f, "cover"),
    "tools": ["ComfyUI"], "models": ["SDXL", "IP-Adapter"],
    "body": ["Style transfer explorations using SDXL and IP-Adapter: a single initial image re-rendered as crayon, whiteboard marker and oil painting."],
    "sections": [{"title": "Initial image → styles", "media": [
        {"src": take("ltxvideo-848-644x644.png", f, "initial"), "caption": "Initial image"},
        {"src": take("comfyui-01130-644x644.png", f, "crayon"), "caption": "Crayon"},
        {"src": take("comfyui-01132-644x644.png", f, "whiteboard"), "caption": "Whiteboard marker"},
        {"src": "lab/sdxl-style/cover.jpg", "caption": "Oil painting"}]}],
})

f = "lab/early-v2v"
projects.append({
    "id": "early-video-to-video",
    "section": "lab", "type": "experiment",
    "title": "Early Video-to-Video Style Transfer",
    "summary": "Where it started: SD 1.5, IP-Adapter and AnimateDiff.",
    "cover": take("transfer-hqgif256-420.gif", f, "cover"),
    "tools": ["ComfyUI"], "models": ["SD 1.5", "IP-Adapter", "AnimateDiff"],
    "body": ["Early video-to-video style transfer explorations from the first wave of open generative video tools."],
    "sections": [
        {"title": "Source → stylized", "media": [
            {"src": take("source-hqgif256-420.gif", f, "source"), "caption": "Source video"},
            {"src": "lab/early-v2v/cover.mp4", "caption": "Stylized video"}]},
        {"title": "AnimateDiff & SD 1.5 explorations", "media": seq(["animatediff-00187-hqgif32-320.gif", "animatediff-00216-hqgif32-320.gif", "animatediff-00030-hqgif32-320.gif", "animatediff-00058-hqgif32-320.gif"], f, "animatediff-")},
    ],
})

# ----------------------------------------------------------- AI LAB: Tools
projects.append({
    "id": "svg-vectorizer",
    "section": "lab", "type": "tool",
    "title": "Raster → SVG Vectorizer",
    "summary": "A custom Python web app that turns generated frames into clean, editable SVGs for Illustrator and animation pipelines.",
    "cover": "lab/qwen-restyle/gen-04.jpg",
    "tools": ["Python"], "models": ["Built with Gemini + Claude"],
    "body": [
        "Built alongside the Qwen Restyle LoRA: generated storyboard frames are processed through a custom Python-based web app that converts them into clean, editable SVG files — directly usable within Illustrator and downstream animation pipelines.",
    ],
    "links": [{"label": "See it in the Restyle LoRA pipeline", "url": "project.html?id=qwen-restyle-lora"}],
    "sections": [],
})

# Placeholders: draft entries only show while running `npm run dev`.
for i in (1, 2):
    projects.append({
        "id": f"tool-draft-{i}", "section": "lab", "type": "tool", "draft": True,
        "title": f"AI tool for artists #{i}",
        "summary": "DRAFT — describe a creative tool you built and deployed for artists.",
        "cover": "lab/visual/cover.mp4",
        "tools": ["ComfyUI", "Python"], "models": [],
        "body": ["DRAFT — What problem did it solve for artists? Who used it, and what changed for them?"],
        "sections": [],
    })
projects.append({
    "id": "lora-draft-1", "section": "lab", "type": "lora", "draft": True,
    "title": "New LoRA (draft)",
    "summary": "DRAFT — add your latest LoRA training here.",
    "cover": "lab/liquid-morphing/03.mp4",
    "models": ["Wan 2.2 (Video)"], "body": ["DRAFT"], "sections": [],
})

# ------------------------------------------------------------------ WORK
W = "work"
def work(pid, title, summary, roles, cover, media=None, **kw):
    p = {"id": pid, "section": "work", "type": kw.pop("type", "campaign"), "title": title, "summary": summary,
         "roles": roles, "cover": cover, "body": kw.pop("body", [summary]), "sections": []}
    if media:
        p["sections"].append({"title": "Film", "layout": "wide", "media": media})
    p.update(kw)
    return p

projects += [
    {"id": "ai-campaign-draft-1", "section": "work", "type": "ai-campaign", "draft": True,
     "title": "Global AI-led campaign (draft)", "client": "Client name",
     "summary": "DRAFT — a global commercial campaign led with AI. Fill in the story, role and results.",
     "roles": ["AI Lead", "Creative Producer"], "cover": "lab/embroidery/emb-01.mp4",
     "stats": [{"value": "00", "label": "markets"}, {"value": "00", "label": "assets"}],
     "body": ["DRAFT — Brief, approach, pipeline, results."], "sections": []},
    {"id": "ai-campaign-draft-2", "section": "work", "type": "ai-campaign", "draft": True,
     "title": "AI-led campaign #2 (draft)", "client": "Client name",
     "summary": "DRAFT — second AI-led campaign.", "roles": ["AI Lead"], "cover": "lab/liquid-morphing/05.mp4",
     "body": ["DRAFT"], "sections": []},
    work("smart-tank-launch", "Smart Tank Global Launch", "A global launch campaign for the latest Smart Tank printer series, delivered across 20+ countries.",
         ["Creative Producer", "Team Lead — Motion Design"], "youtube:Hgu5AEh1SCc", [yt("Hgu5AEh1SCc")], client="HP", featured=True,
         stats=[{"value": "20+", "label": "countries"}, {"value": "500+", "label": "localized assets"}, {"value": "15+", "label": "languages"}],
         body=["A global launch campaign for the latest Smart Tank printer series, delivered across 20+ countries. The project involved concept development and the creation of over 500 localized assets in 15+ languages, with a strong focus on consistency, scalability, and efficient production workflows."]),
    work("hp-950-webcam", "HP 950 4K Webcam — Product Sizzle", "A product sizzle video for the launch of the HP 950 4K Webcam.",
         ["Team Lead — Motion Design"], "youtube:iMMrEZv83co", [yt("iMMrEZv83co")], client="HP", type="product-launch", featured=True),
    work("china-studio-anniversary", "China Studio Anniversary Film", "A celebratory film for the first anniversary of the Beijing studio, rooted in local culture and custom illustration.",
         ["Concept", "Team Lead — Illustration & Animation"], "youtube:T4JtbirRIC8", [yt("T4JtbirRIC8")], type="brand-film", featured=True,
         body=["Created to celebrate the first anniversary of the Beijing studio, this film integrates local cultural elements and custom illustrations to build a visually distinct and meaningful narrative. The focus was on creating a celebratory piece that felt rooted in place while remaining consistent with the studio’s visual language."]),
    work("go-beyond-sustainability", "Go Beyond — Sustainability Campaign", "Complex sustainability narratives translated into a cohesive visual system designed to scale across regions.",
         ["Creative Producer", "Team Lead — Motion & Design"], take("breakout20sustainability20video20master2021st20nov202023.mp4-snapshot-00.38.400-1000x563.jpg", W, "go-beyond"),
         [yt("7t_RhgV8Rqw")], client="HP", featured=True,
         links=[{"label": "Watch more", "url": "https://drive.google.com/drive/folders/1qzJQ2jh2V5He7bjj-ZeQV9GoBNt7RCJ_?usp=drive_link"}],
         body=["The “Go Beyond” campaign translated complex sustainability narratives into a cohesive visual system designed to scale across regions."]),
    work("hp-spectre", "HP Spectre Product Film", "A product launch film for the HP Spectre series of laptops.",
         ["Creative Producer", "Team Lead — Motion & Design"], take("hp20spectre20.mp4-snapshot-00.12.260-1000x563.jpg", W, "hp-spectre"),
         [yt("-8gjzMxysqE")], client="HP", year="2023", type="product-launch",
         body=["Created a product launch film for the HP Spectre series of laptops in 2023."]),
    work("hp-envy", "HP Envy Series Launch", "Product launch film for the HP Envy series.",
         ["Motion Design"], "youtube:Mw0xKD4bAtQ", [yt("Mw0xKD4bAtQ")], client="HP", type="product-launch"),
    work("hp-envy-x360", "HP Envy x360 Launch", "Product launch film for the HP Envy x360.",
         ["Motion Design"], "youtube:0qFPhe2NbIc", [yt("0qFPhe2NbIc")], client="HP", type="product-launch"),
    work("hp-monitors", "HP Conferencing Monitors", "A series of videos for HP’s most advanced line-up of conferencing monitors.",
         ["Creative Producer", "Team Lead — Motion & Design"], take("hp-weezer-020724-master-v1.-420-cuda-10mbit-aac128.mp4-snapshot-00.40.000-1000x563.jpg", W, "hp-monitors"),
         [yt("uXSZrK5MYjo")], client="HP", type="content-series",
         links=[{"label": "Watch more", "url": "https://drive.google.com/drive/folders/1Y7Q_MvlhUsft3zZ4fbuTgpfxLrP9ayaU?usp=sharing"}]),
    work("hp-accessories", "HP Accessories", "10+ films for a range of HP accessories.",
         ["Creative Producer", "Lead — Motion & Design"], take("z3700-dual-mouse-3840-2160-3.mp4-snapshot-00.34.530-jpeg10-1-1920x1080.jpg", W, "hp-accessories"),
         [yt("40UzxKEI98E")], client="HP", type="content-series", stats=[{"value": "10+", "label": "films"}],
         links=[{"label": "Watch more", "url": "https://drive.google.com/drive/folders/1WIUAQhMN6IiUVZUyZBGiIdO4F4t3CNMf?usp=drive_link"}]),
    work("bps-intel", "BPS with Intel", "50+ feature videos for the latest line-up of Intel laptops.",
         ["Creative Producer", "Team Lead — Motion & Design"], take("bps-about-dynamic20voice20leveling-draft202.mp4-snapshot-00.10.678-1000x563.jpg", W, "bps-intel"),
         None, client="Intel", type="content-series", stats=[{"value": "50+", "label": "feature videos"}],
         links=[{"label": "Watch the series", "url": "https://drive.google.com/drive/folders/1hAY8ttUhmJ22uLMZ1V_rlxsUNdRgvAD-?usp=drive_link"}]),
    work("greater-asia-recap", "Greater Asia — 2022 Recap", "A compilation of selected work created for Greater Asia throughout 2022.",
         ["Creative Producer", "Concept", "Team Lead — Design & Animation"], take("ga20recap20video-november202022.mp4-snapshot-00.28.004-1000x563.jpg", W, "greater-asia"),
         [yt("pNvbwG1y8Wk")], client="HP", year="2022", type="content-series"),
]

# ------------------------------------------------------------------ ARCHIVE
TITLES = {
    "pagewide20xl20395020and20425020r220april2019.mp4-snapshot-00.35.025-858x483.jpg": "HP PageWide XL",
    "hp-omen-v5-master-video-no20subtitle.mp4-snapshot-00.40.399-858x483.jpg": "HP Omen",
    "snackable20content20video-3120july-v2.mp4-snapshot-00.27.220-858x483.jpg": "Snackable content",
    "health-videos-opening-bumper-hqgif256-1080.gif": "Health videos — opening bumper",
    "game-night-hqgif256-640.gif": "Game Night",
    "arize-master-hqgif256-420.gif": "Arize",
    "goodwill-boot-short-hqgif256-420.gif": "Goodwill boot",
    "rantchant.mp4-snapshot-00.46.094-644x362.jpg": "Rant Chant",
    "cg-short-hqgif256-420.gif": "CG short",
    "til-01-hqgif256-640.gif": "TIL", "til-02-hqgif256-420.gif": "TIL",
    "future-short-hqgif32-640.gif": "Future",
    "panasonic-p85-nxt-final-short-hqgif256-640.gif": "Panasonic P85 NXT",
    "bpft-20-short-hqgif256-420.gif": "BPFT",
    "helping-india-save-web-promo-short-hqgif256-420.gif": "Helping India Save — web promo",
    "race-short-hqgif256-420.gif": "Race",
    "3d-capability-film-1-hqgif256-420.gif": "3D capability film", "3d-capability-film-2-hqgif256-420.gif": "3D capability film",
    "3d-capability-film-3-hqgif256-420.gif": "3D capability film",
    "ge-bhoruka-short-film-hqgif256-420.gif": "GE Bhoruka short film",
    "particle-short-hqgif256-420.gif": "Particles",
    "muthoot-finance-18-jan-hqgif256-420.gif": "Muthoot Finance",
    "bci-final-hqgif256-420.gif": "BCI",
    "shoes-1.gif": "Shoes", "perfume-particles-hqgif32-640.gif": "Perfume particles",
    "006-708x398.jpg": "",
}
archive_a = ["19", "30", "17", "24", "25", "23", "21", "28", "pagewide20xl20395020and20425020r220april2019.mp4-snapshot-00.35.025-858x483.jpg",
             "18", "29", "26", "hp-omen-v5-master-video-no20subtitle.mp4-snapshot-00.40.399-858x483.jpg", "20", "27", "32", "33", "22",
             "snackable20content20video-3120july-v2.mp4-snapshot-00.27.220-858x483.jpg", "16", "14", "13", "12", "11", "31",
             "health-videos-opening-bumper-hqgif256-1080.gif", "10", "game-night-hqgif256-640.gif"]
archive_b = ["01", "09", "07", "08", "05", "03", "02", "06", "34", "arize-master-hqgif256-420.gif", "goodwill-boot-short-hqgif256-420.gif",
             "rantchant.mp4-snapshot-00.46.094-644x362.jpg", "cg-short-hqgif256-420.gif", "til-01-hqgif256-640.gif", "future-short-hqgif32-640.gif",
             "til-02-hqgif256-420.gif", "panasonic-p85-nxt-final-short-hqgif256-640.gif", "bpft-20-short-hqgif256-420.gif",
             "helping-india-save-web-promo-short-hqgif256-420.gif", "race-short-hqgif256-420.gif", "3d-capability-film-3-hqgif256-420.gif",
             "ge-bhoruka-short-film-hqgif256-420.gif", "3d-capability-film-1-hqgif256-420.gif", "3d-capability-film-2-hqgif256-420.gif",
             "particle-short-hqgif256-420.gif", "ezgif.com-resize.gif", "muthoot-finance-18-jan-hqgif256-420.gif", "bci-final-hqgif256-420.gif",
             "15", "shoes-1.gif", "perfume-particles-hqgif32-640.gif", "04", "006-708x398.jpg"]
gallery = []
for i, n in enumerate(archive_a + archive_b):
    old = f"{n}-hqgif256-420.gif" if n.isdigit() else n
    item = {"src": take(old, "archive", f"{i + 1:02d}")}
    if TITLES.get(old):
        item["title"] = TITLES[old]
    gallery.append(item)

CONTENT.mkdir(parents=True, exist_ok=True)
(CONTENT / "projects.json").write_text(json.dumps(projects, indent=2, ensure_ascii=False), encoding="utf-8")
(CONTENT / "gallery.json").write_text(json.dumps(gallery, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"{len(projects)} projects, {len(gallery)} archive items, {sum(1 for _ in SRC.rglob('*') if _.is_file())} media files")
