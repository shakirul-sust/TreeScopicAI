const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '../species_data/species.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const COPY_TO_RESOURCES = path.join(__dirname, '../src-tauri/resources/species.db');
const COPY_TO_DEBUG = path.join(__dirname, '../src-tauri/target/debug/species.db');

// Ensure the species_data directory exists
if (!fs.existsSync(path.join(__dirname, '../species_data'))) {
  fs.mkdirSync(path.join(__dirname, '../species_data'), { recursive: true });
}

// Initialize the database
function initializeDatabase() {
  console.log('Initializing database...');
  
  // Read schema SQL
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  
  // Create or open the database
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      process.exit(1);
    }
    console.log('Connected to the SQLite database.');
  });
  
  // Execute schema SQL
  db.exec(schemaSql, (err) => {
    if (err) {
      console.error('Error executing schema SQL:', err.message);
      process.exit(1);
    }
    console.log('Database schema initialized successfully.');
    
    // Create sample activation keys (for development purposes)
    createSampleActivationKeys(db);
  });
}

// Generate and store sample activation keys
function createSampleActivationKeys(db) {
  const crypto = require('crypto');
  
  // Generate 5 sample keys
  const sampleKeys = [];
  for (let i = 0; i < 5; i++) {
    const key = crypto.randomBytes(16).toString('hex');
    sampleKeys.push(key);
  }
  
  // Store the keys in the database
  const stmt = db.prepare('INSERT OR IGNORE INTO activation_keys (key_hash) VALUES (?)');
  
  sampleKeys.forEach(key => {
    stmt.run(key);
  });
  
  stmt.finalize();
  
  // Write the keys to a file for reference
  const keysOutput = sampleKeys.join('\n');
  fs.writeFileSync(path.join(__dirname, '../species_data/sample_keys.txt'), keysOutput);
  
  console.log('Sample activation keys generated and stored.');
  console.log('Keys saved to species_data/sample_keys.txt');
  
  // Close the database connection
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
      
      // Copy the database to the resources and debug folders
      try {
        // Ensure the resources directory exists
        if (!fs.existsSync(path.dirname(COPY_TO_RESOURCES))) {
          fs.mkdirSync(path.dirname(COPY_TO_RESOURCES), { recursive: true });
        }
        
        fs.copyFileSync(DB_PATH, COPY_TO_RESOURCES);
        console.log(`Database copied to ${COPY_TO_RESOURCES}`);
        
        // Copy to debug if it exists
        if (fs.existsSync(path.dirname(COPY_TO_DEBUG))) {
          fs.copyFileSync(DB_PATH, COPY_TO_DEBUG);
          console.log(`Database copied to ${COPY_TO_DEBUG}`);
        }
      } catch (err) {
        console.error('Error copying database:', err.message);
      }
    }
  });
}

// Run the initialization
initializeDatabase(); 