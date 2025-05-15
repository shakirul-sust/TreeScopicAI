-- SQLite schema for wood species database

-- Main table for wood species
CREATE TABLE IF NOT EXISTS species (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scientific_name TEXT NOT NULL UNIQUE,
    common_name TEXT NOT NULL,
    family TEXT NOT NULL,
    description TEXT NOT NULL,
    habitat TEXT,
    distribution TEXT,
    properties TEXT,
    uses TEXT,
    conservation_status TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing model labels and their mapping to species
CREATE TABLE IF NOT EXISTS model_labels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL UNIQUE,
    species_id INTEGER NOT NULL,
    confidence_threshold REAL DEFAULT 0.5,
    FOREIGN KEY (species_id) REFERENCES species(id)
);

-- Table for storing activation keys
CREATE TABLE IF NOT EXISTS activation_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_hash TEXT NOT NULL UNIQUE,
    is_used BOOLEAN DEFAULT FALSE,
    used_by TEXT,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

