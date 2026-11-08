# Rubin Danely — Art, Design & Technology

Personal portfolio featuring an interactive 3D gallery, Bines Academy, Acne Camz, and fine art.

## Run locally

From the repository root:

```sh
python3 -m http.server 8000 --directory gallery-3d
```

Open http://localhost:8000 in your browser. Python 3 is required for the local server; the portfolio itself is a static website. The 3D gallery loads Three.js from a CDN.

On desktop, use WASD or arrow keys to move and drag to look. On phones, use the movement stick and drag the screen to look. Featured project shortcuts open their detail panels.
