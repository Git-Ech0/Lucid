# ♿ Lucid — Web Accessibility Extension

> Accessibility tools for any website, with built-in keyless AI helpers.

Lucid is a Chrome extension that lets users quickly adapt site readability, visibility, and interaction comfort without requiring websites to implement anything.

## ✨ Current Feature Set

### Tools tab (toggle features)

- **Dyslexia Font** — improved letter/word spacing and line height
- **Reading Ruler** — tracking bar that follows cursor movement
- **Highlight Links** — stronger visual link affordances
- **High Contrast** — high-contrast page theming
- **Large Text** — global page text scaling
- **Color Blind Mode** — deuteranopia/protanopia/tritanopia simulation filters
- **Element Remover** — click elements to hide and persist removals per page
- **Big Click Targets** — expands interactive hit areas
- **Page Outline** — floating headings navigator
- **Stop Animations** — suppresses transitions/animations and autoplay motion

### AI context-menu tools

- **Simplify selected text**
- **Explain selected text**
- **Translate selected text to plain English**
- **Read selected text aloud**
- **Summarize current page**
- **Describe image**
- **Help fill form fields**

## 🤖 AI Provider Behavior (Current)

- No API key required.
- Lucid uses **Pollinations** with an OpenAI-compatible endpoint and model fallback chain (`openai` → `openai-fast` → `llama`).
- If those model calls fail, Lucid falls back to the plain text Pollinations endpoint.
- Image-description uses Pollinations vision-compatible model fallback (`openai` → `openai-fast`).

## 🧩 Other capabilities

- **Per-feature keyboard shortcuts** (`Alt+Shift+<key>`) configurable in Settings
- **Theme mode**: Dark / Light popup
- **Feature visibility controls** to hide tools from the popup UI
- **Global reset** for extension settings
- **Persistent state** across tabs/pages via `chrome.storage.local`

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
- `popup.html` / `popup.js` — extension popup UI + state controls
- `welcome.html` — first-install landing screen

## 📄 License

MIT
