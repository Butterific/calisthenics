# 🏋️‍♂️ AI Video Exercise Generator
Built for HackJPS 2026

## ✨ Features
- **Material 3 UI**: Beautiful, clean, and intuitive user interface built with `@mui/material`.
- **Zero-Backend Video Generation**: Uses `@ffmpeg/ffmpeg` compiled to WASM. Your browser acts as the rendering server!
- **Dynamic Content**: Auto-loops Pexels stock video to fit the timer!
- **Live Text Overlays**: Automatically superimposes exercise titles and a live countdown timer directly onto the video frames.
- **Auto-DJing**: Splices randomly selected music loops into the background of your workout video.

## 🚀 Getting Started

Since the browser dictates strict security headers to handle WebAssembly operations involving shared memory (`SharedArrayBuffer`), you cannot run this off a static file server easily. Use our Vite setup!

### 1. Install Dependencies
Make sure you have Node >18.x installed and simply run:
```bash
npm install
```

### 2. Configure API Keys
To use the live AI generator and Pexels integration, copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Inside `.env` (or in your Cloudflare pages secrets), populate:
- `GEMINI`: Get this from Google AI Studio.
- `PLEX`: Get this from Pexels Developer portal.

### 3. Run Locally!
```bash
npm run dev
```
Open **http://localhost:5173**. 
> Note: On Vite load, your browser developer console will enforce `Cross-Origin-Embedder-Policy: require-corp` to permit WebAssembly multithreading. This is normal and correctly configured in our `vite.config.js`.

---

## 🏗 Built With
- **React + Vite**
- **MUI (Material UI)** 
- **Google Gemini API** (via standard `fetch`)
- **Pexels API**
- **FFmpeg.WASM**

Happy exercising! 💪
