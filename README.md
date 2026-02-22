# ♿ Lucid — Web Accessibility Extension

> Accessibility tools for any website, plus keyless AI actions.

Lucid is a Chrome extension that helps users adapt readability, contrast, interaction targets, and motion on any page without requiring site-side integration.

## ✨ Current Features (Accurate)

### Tools tab (toggles)

- **Dyslexia Font** — improves spacing/line-height for easier reading
- **Reading Ruler** — cursor-following guide bar
- **Highlight Links** — stronger visual affordance for anchors
- **High Contrast** — high-contrast page styling
- **Large Text** — global text scaling
- **Color Blind Mode** — deuteranopia/protanopia/tritanopia filters
- **Element Remover** — hide selected elements with per-page persistence
- **Big Click Targets** — increases interactive hit area sizes
- **Page Outline** — floating heading navigator
- **Stop Animations** — reduces transitions/autoplay motion

### AI context-menu actions

- **Simplify selected text**
- **Explain selected text**
- **Translate selected text to plain English**
- **Read selected text aloud**
- **Summarize current page**
- **Describe image**
- **Help fill form fields**

## 🤖 AI Integration (Current)

- Provider: **Pollinations**
- Endpoint: OpenAI-compatible Pollinations chat endpoints
- Model: **`openai`** (this is the corrected model in use)
- API key: **not required**

## ⚙️ Settings / Behavior

- Per-feature keyboard shortcuts (`Alt+Shift+<key>`) configurable in Settings
- Popup theme mode: Dark / Light
- Feature visibility controls (hide tools in popup)
- Reading level and read-aloud speed controls
- Global reset of extension settings
- State persistence via `chrome.storage.local`

## 🚀 Installation

1. Clone this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select this project folder.

## 🏗️ Project Structure

- `manifest.json` — extension metadata + permissions
- `background.js` — context menus, startup/install lifecycle, message dispatch
- `content.js` — page-side feature engine + AI handlers
- `content.css` — injected base styles
- `popup.html` / `popup.js` — popup UI + state controls
- `welcome.html` — first-install onboarding page

## 📄 License

MIT
