# ♿ ClearPath — Adaptive Accessibility Engine

> AI-powered browser extension that makes *any* website accessible for people with disabilities.

![ClearPath Banner](https://via.placeholder.com/900x300/0f1117/6c8fff?text=ClearPath+%E2%80%94+Adaptive+Accessibility)

## 🎯 What It Does

ClearPath is a Chrome extension that gives users with disabilities full control over how any website looks, reads, and feels — without needing any website to do anything special. Works everywhere, instantly.

### Key Features

| Feature | Description |
|---|---|
| **Disability Profiles** | One-click presets for Dyslexia, ADHD, Low Vision, Motor, and Cognitive needs |
| **AI Text Simplifier** | Highlight any text → free keyless AI rewrites it in plain language, in-place |
| **Reading Ruler** | Blue highlight line that follows your mouse for tracking support |
| **Focus Spotlight** | Dims everything except the paragraph you hover over |
| **Read Aloud** | Select text → hear it spoken at your preferred speed |
| **High Contrast Mode** | Boosts contrast across the entire page |
| **Reduce Clutter** | Hides ads, sidebars, popups, and distractions |
| **Big Click Targets** | Enlarges all buttons/links to 44px minimum (WCAG standard) |
| **Stop Animations** | Freezes GIFs and CSS transitions |
| **Large Text** | Scales all text from 110%–150% site-wide |
| **Link Highlighting** | Makes all links visually distinct and easy to spot |
| **Dyslexia Font** | Applies optimal spacing for dyslexic readers |

---

## 🚀 Installation (No Build Required)

```bash
git clone https://github.com/YOUR_USERNAME/clearpath.git
```

1. Open Chrome → navigate to `chrome://extensions`
2. Enable **Developer Mode** (top right toggle)
3. Click **"Load unpacked"**
4. Select the cloned `clearpath/` folder
5. Click the ClearPath icon in your toolbar — you're live!

**AI features are keyless:** Lucid first uses DuckDuckGo AI (GPT-4o-mini), then automatically falls back to Pollinations if needed.

---

## 🏗️ Architecture

```
clearpath/
├── manifest.json        # Extension config (Manifest V3)
├── popup.html           # Extension UI (360px panel)
├── popup.js             # UI logic, state management, profile system
├── content.js           # Page modification engine (runs on every site)
├── content.css          # Base injected styles
├── background.js        # Service worker (lifecycle, install events)
└── welcome.html         # First-install onboarding page
```

**No build tools. No npm. No bundler.** Open the folder and it works.

### How the AI Simplifier Works

1. User selects text on any webpage
2. Clicks "Simplify Selected Text" in the popup
3. `popup.js` sends a message to `content.js`
4. `content.js` calls DuckDuckGo AI first (no API key), with Pollinations as fallback
5. The selected text is replaced in-place with the simplified version
6. A ✨ badge is appended — clicking it restores the original text

---

## 🧑‍🦽 Who This Helps

- **Dyslexia** (~15-20% of the population): Specialized font spacing, reading ruler, link highlighting
- **ADHD**: Focus spotlight removes distractions, animations stopped, clean layout
- **Low Vision**: High contrast, enlarged text, bigger click targets
- **Motor Disabilities**: All interactive targets enlarged to 44px (WCAG 2.5.5 standard)
- **Cognitive Disabilities**: Simplified layouts, AI-rewritten content at accessible reading levels
- **General Reading Support**: Read-aloud, text simplification for anyone encountering complex language

---

## 💡 Design Decisions

- **No build step** — judges and users can run this in 30 seconds
- **State persists across pages** — your settings follow you everywhere
- **Click-to-restore** — AI changes are never permanent; one click undoes them
- **Profiles as a starting point** — users can customize after applying a profile
- **WCAG-informed** — big targets, contrast ratios, and text sizing follow real accessibility standards

---

## 🔮 Future Roadmap

- Voice command navigation ("scroll down", "click login")
- Per-site profile memory
- Screen reader integration
- Keyboard shortcut system
- User-shareable profile configs

---

## 📄 License

MIT — use it, fork it, build on it.

---

*Built for [Hackathon Name] by [Your Name] — February 2026*
