# 🔥 Campfire Journal

> A sleek, local-first digital journal app integrated with **Local AI** for thoughtful reflection, memory keeping, and complete privacy.

Campfire is designed for serene, distraction-free writing where your personal thoughts, memories, and reflections remain 100% private on your own device—enhanced by private, on-device artificial intelligence.

---

## ✨ Selling Points & Core Values

* **🔒 100% Private & Local-First**: Your personal entries, notes, and thoughts are stored directly on your local device. No forced cloud accounts, no third-party tracking, and zero telemetry.
* **🤖 On-Device Local AI Integration**: Powered by local LLMs (via Ollama / Gemma model). Gain AI-driven journaling prompts, intelligent summaries, and reflection assistance without transmitting your private data to cloud AI providers.
* **💻 Dual Platform (Desktop & PWA)**: Enjoy a native Windows desktop experience or install the responsive Progressive Web App (PWA) on mobile devices with full offline capabilities.
* **☁️ Private Google Drive Backup**: Optional background sync to your personal Google Drive account. Maintain total data ownership with automatic offsite backups.
* **✍️ Cozy & Distraction-Free UI**: Beautiful dark-mode interface built for deep focus, equipped with Markdown support, custom tagging, and instant local search.

---

## 🏗️ Architecture & Platform Overview

Campfire is structured as a **PNPM monorepo** consisting of three main packages:

```text
Campfire/
├── core/       # Shared TypeScript domain models, storage abstraction & i18n
├── desktop/    # Desktop application (Tauri v2 + Rust backend)
└── mobile/     # Progressive Web App (Vite + React 19 + Dexie IndexedDB)
```

### 1. 🖥️ Desktop Application (`desktop`)
* **Framework**: Native desktop shell built with **Tauri v2** (Rust backend + WebView2 frontend).
* **Storage**: Directly interfaces with local disk storage (`@tauri-apps/plugin-fs`).
* **Store Capabilities**: Windows Store bundle with `runFullTrust` capability for Win32 local storage execution and background backup requests.
* **Local AI Integration**: Tuned for local hardware via custom `Modelfile` (optimized quantized Gemma model targeting consumer GPU VRAM & thread configurations).

### 2. 📱 Mobile PWA (`mobile`)
* **Framework**: Web & Mobile application built with **React 19**, **Vite**, and `vite-plugin-pwa`.
* **Offline Storage**: Uses **Dexie.js (IndexedDB)** for local-first mobile persistence.
* **PWA Features**: Service workers via Workbox for offline asset caching and home screen installation.
* **Security**: Code obfuscation via `javascript-obfuscator` during production builds.

### 3. 📦 Shared Core (`core`)
* Shared package (`@campfire/core`) maintaining centralized domain entities, state schemas, i18n translations, and platform-agnostic business logic.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Monorepo Manager** | [PNPM Workspaces](https://pnpm.io/) |
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Desktop Shell** | [Tauri v2](https://v2.tauri.app/) (Rust + WebView2) |
| **Build & Bundler** | [Vite](https://vitejs.dev/), [Vitest](https://vitest.dev/) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) |
| **Mobile Database** | [Dexie.js](https://dexie.org/) (IndexedDB) |
| **Local AI Engine** | [Ollama](https://ollama.com/) with quantized Gemma models (`Modelfile`) |
| **State & i18n** | [Zustand](https://github.com/pmndrs/zustand), [react-i18next](https://react.i18next.com/) |

---

## 🧠 Local AI Setup

Campfire includes a pre-configured `Modelfile` for running a lightweight, local quantized Gemma model tailored for consumer hardware (e.g. low VRAM GPUs and physical CPU thread constraints):

```dockerfile
FROM gemma4:e2b-it-qat
PARAMETER num_gpu 25
PARAMETER num_batch 128
PARAMETER num_thread 4
PARAMETER top_k 40
PARAMETER top_p 0.9
PARAMETER temperature 0.7
```

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* [PNPM](https://pnpm.io/) (`npm install -g pnpm`)
* [Rust](https://www.rust-lang.org/) (for Tauri desktop development)

### Installation & Running

1. **Clone the repository & install dependencies**:
   ```bash
   pnpm install
   ```

2. **Run Desktop in Development Mode**:
   ```bash
   pnpm --filter desktop dev:tauri
   ```

3. **Run Mobile PWA in Development Mode**:
   ```bash
   pnpm --filter mobile dev
   ```

4. **Build All Packages**:
   ```bash
   pnpm build
   ```

---

## 📄 License & Store Releases

This repository contains signed installers for the Microsoft Store submission of **Campfire Journal**.
* Copyright © 2026 happyKnight. All rights reserved.