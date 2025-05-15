#!/usr/bin/env python3
import json
import sqlite3
import os
import shutil
import traceback

# Paths
DB_PATH = 'src-tauri/resources/species.db'
JSON_PATH = 'backend/species_data.json'
DB_PATHS = [
    'src-tauri/resources/species.db',
    'species_data/species.db',
    'src-tauri/target/debug/species.db',
    'src-tauri/target/release/species.db'
]

def rebuild_database():
    try:
        print("Rebuilding database with enhanced species data...")
        
        # Delete existing database files
        for db_path in DB_PATHS:
            if os.path.exists(db_path):
                try:
                    print(f"Removing existing database at {db_path}")
                    os.remove(db_path)
                except PermissionError:
                    print(f"Warning: Could not remove {db_path} - file is in use. Will try to overwrite.")
        
        # Create directory structure if it doesn't exist
        for db_path in DB_PATHS:
            os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        print("Creating new database...")
        # Create a new database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        print("Creating tables...")
        # Create tables
        cursor.execute('''
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
        )
        ''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS model_labels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT NOT NULL UNIQUE,
            species_id INTEGER NOT NULL,
            confidence_threshold REAL DEFAULT 0.5,
            FOREIGN KEY (species_id) REFERENCES species(id)
        )
        ''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS activation_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key_hash TEXT NOT NULL UNIQUE,
            is_used BOOLEAN DEFAULT FALSE,
            used_by TEXT,
            used_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        print(f"Loading JSON data from {JSON_PATH}...")
        # Load JSON data
        with open(JSON_PATH, 'r') as f:
            species_data = json.load(f)
        
        print(f"Found {len(species_data)} species in JSON file.")
        
        # Import data
        species_count = 0
        label_count = 0
        
        print("Importing species data...")
        for species_entry in species_data:
            scientific_name = species_entry.get('scientific_name', '')
            family = species_entry.get('family', '')
            
            # Get local names and create common_name string
            local_names = species_entry.get('local_name', [])
            common_name = ', '.join(local_names) if local_names else scientific_name
            
            # Create properties object
            properties_obj = {}
            
            # Add wood anatomy if available
            wood_anatomy = species_entry.get('wood_anatomy', {})
            if wood_anatomy:
                for key, value in wood_anatomy.items():
                    properties_obj[key] = value
            
            # Add additional properties
            for prop in ['tree_height_m', 'tree_height_range', 'bark_thickness_mm', 
                        'bark_thickness_range', 'shade_tolerant', 'shade_intolerant', 
                        'flowering_time', 'fruiting_time', 'deciduous']:
                if prop in species_entry:
                    properties_obj[prop] = species_entry[prop]
            
            # Convert properties to JSON string
            properties = json.dumps(properties_obj)
            
            # Get usages
            usages = species_entry.get('usages', [])
            uses = json.dumps(usages)
            
            # Get description/notes
            description = species_entry.get('notes', '')
            
            # Get habitat, distribution, conservation_status if available
            habitat = species_entry.get('habitat', None)
            distribution = species_entry.get('distribution', None)
            conservation_status = species_entry.get('conservation_status', None)
            
            # Insert into species table
            cursor.execute('''
            INSERT INTO species 
            (scientific_name, common_name, family, description, properties, uses) 
            VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                scientific_name, 
                common_name, 
                family, 
                description, 
                properties, 
                uses
            ))
            
            species_id = cursor.lastrowid
            species_count += 1
            
            # Create model label from scientific name and first local name
            first_local_name = local_names[0] if local_names else ''
            model_label = f"{scientific_name}_{first_local_name}"
            
            # Insert into model_labels table
            cursor.execute('''
            INSERT INTO model_labels (species_id, label)
            VALUES (?, ?)
            ''', (species_id, model_label))
            label_count += 1
            
            # Add additional labels for each local name
            for local_name in local_names:
                label = f"{scientific_name}_{local_name}"
                cursor.execute('''
                INSERT OR IGNORE INTO model_labels (species_id, label)
                VALUES (?, ?)
                ''', (species_id, label))
                label_count += 1
                
            # Add alternative spelling for Swietenia mahogoni
            if scientific_name == "Swietenia mahagoni" or scientific_name == "Swietenia mahogoni":
                alt_spelling = "Sweitenia mahogoni"
                
                # Add label with alternative spelling
                cursor.execute('''
                INSERT OR IGNORE INTO model_labels (species_id, label)
                VALUES (?, ?)
                ''', (species_id, alt_spelling))
                
                # Add with local name
                if first_local_name:
                    alt_label = f"{alt_spelling}_{first_local_name}"
                    cursor.execute('''
                    INSERT OR IGNORE INTO model_labels (species_id, label)
                    VALUES (?, ?)
                    ''', (species_id, alt_label))
                
                print(f"Added alternative spelling '{alt_spelling}' for {scientific_name}")
        
        print("Committing changes to database...")
        # Commit changes
        conn.commit()
        
        print("Copying database to target locations...")
        # Copy the database file to all target locations
        for target_path in DB_PATHS[1:]:
            if DB_PATH != target_path:
                print(f"Copying database to {target_path}")
                os.makedirs(os.path.dirname(target_path), exist_ok=True)
                shutil.copy2(DB_PATH, target_path)
        
        # Add special activation keys that work in both web and desktop environments
        print("Adding special activation keys to database...")
        special_keys = [
            "eb9613ca2d9ac438553debfb77426ee8",
            "3eb7c8193d9a65cf5440090763a64ecf",
            "9d5240bb66cba84e5e2a55544c1ba431",
            "3755c9402da1b3525dbb3088dfb08084",
            "1befff97c87c21329365adda93b840a8"
        ]
        
        for key in special_keys:
            try:
                cursor.execute('''
                INSERT OR IGNORE INTO activation_keys (key_hash, is_used)
                VALUES (?, 0)
                ''', (key,))
            except sqlite3.Error as e:
                print(f"Warning: Could not add key {key} to database: {e}")
        
        # Commit the key additions
        conn.commit()
        
        print(f"Database rebuild complete! Imported {species_count} species with {label_count} labels.")
    except Exception as e:
        print(f"Error rebuilding database: {e}")
        traceback.print_exc()

if __name__ == '__main__':
    rebuild_database() 