# TreeScopy - Wood Species Classification App

A cross-platform desktop application that identifies wood species from images using a YOLOv11 model hosted on Hugging Face.

## Features

* Upload images of wood samples
* AI-powered wood species classification
* Detailed information about identified species
* Works offline after one-time activation
* Cross-platform support (Windows, macOS, Linux)

## Technology Stack

* **Frontend**: Tauri + React
* **Database**: SQLite for species information
* **Model**: YOLOv11 hosted on Hugging Face
* **Authentication**: One-time activation key system

## Development

### Prerequisites

* Node.js and npm
* Rust and Cargo
* Tauri CLI

### Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## License

Proprietary - Requires activation key # TreeScopicAI
