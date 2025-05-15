# Species Data Import Tool

This tool imports species data from a JSON file into the SQLite database used by TreeScopy.

## Prerequisites

- Rust and Cargo installed
- SQLite (included in the Rust package)

## Usage

### On Windows

```
import-species.bat path\to\species_data.json
```

### On macOS/Linux

```
./import-species.sh path/to/species_data.json
```

## What This Tool Does

1. Takes the species data from the JSON file
2. Creates the SQLite database tables if they don't exist
3. Imports all species information into the database
4. Creates model labels for each species based on scientific and local names
5. Saves the database to `src-tauri/src/resources/species.db`

## Database Schema

The tool creates two tables:

### `species` table
- `id` - Primary key
- `scientific_name` - Scientific name of the species
- `common_name` - Comma-separated list of common/local names
- `family` - Botanical family
- `description` - Text description (from "notes" in JSON)
- `habitat` - Habitat information (if available)
- `distribution` - Distribution information (if available)
- `properties` - JSON string of wood properties (from "wood_anatomy" in JSON)
- `uses` - JSON array of usage categories (from "usages" in JSON)
- `conservation_status` - Conservation status (if available)
- `image_url` - URL to species image (if available)

### `model_labels` table
- `id` - Primary key
- `species_id` - Foreign key to species table
- `label` - Label string used for model identification

## Common Issues

- **JSON Parse Error**: Make sure your JSON file is valid
- **Permission Denied**: Ensure you have write permissions for the database location
- **Missing Tables**: The tool will create tables if they don't exist, but if there are schema mismatches with existing tables, you might need to delete the database file first 