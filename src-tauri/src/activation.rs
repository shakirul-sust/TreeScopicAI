use serde::{Serialize, Deserialize};
use sha2::{Sha256, Digest};
use std::fs;
use std::io;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
use crate::database::DbConnection;

// Configuration stored in the app data directory
#[derive(Serialize, Deserialize)]
struct AppConfig {
    activated: bool,
    activation_date: u64,
    device_id: String,
    key_hash: String,
}

/// Generate a unique device ID based on system information
fn generate_device_id() -> String {
    let mut hasher = Sha256::new();
    
    // For a robust implementation, you'd want to use something like:
    // - Windows: Windows Management Instrumentation (WMI)
    // - macOS: IOKit
    // - Linux: /etc/machine-id or /var/lib/dbus/machine-id
    // For simplicity, use a combination of timestamp and random values
    
    // Add current time
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    hasher.update(timestamp.to_string().as_bytes());
    
    // Add hostname if available
    if let Ok(hostname) = hostname::get() {
        if let Ok(hostname_str) = hostname.into_string() {
            hasher.update(hostname_str.as_bytes());
        }
    }
    
    // Convert hash to hex string
    let result = hasher.finalize();
    format!("{:x}", result)
}

/// Hash an activation key
fn hash_key(key: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(key.as_bytes());
    let result = hasher.finalize();
    format!("{:x}", result)
}

/// Check if the app is activated by examining the config file
pub fn check_activation(config_path: &Path) -> Result<bool, io::Error> {
    // Ensure the directory exists
    if let Some(parent) = config_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)?;
        }
    }
    
    if !config_path.exists() {
        return Ok(false);
    }
    
    let config_contents = match fs::read_to_string(config_path) {
        Ok(contents) => contents,
        Err(e) => {
            eprintln!("Error reading config file: {}", e);
            return Ok(false); // Treat read errors as not activated
        }
    };
    
    let config: AppConfig = match serde_json::from_str(&config_contents) {
        Ok(config) => config,
        Err(e) => {
            eprintln!("Error parsing config file: {}", e);
            return Ok(false); // Treat parse errors as not activated
        }
    };
    
    Ok(config.activated)
}

/// Attempt to activate the app with a given key
pub fn activate_app(key: &str, config_path: &Path, db: &DbConnection) -> Result<bool, String> {
    // Ensure the directory exists before trying to write to it
    if let Some(parent) = config_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create config directory: {}", e))?;
        }
    }
    
    // Check if key is valid in the database - use raw key for validation
    let is_valid = db.validate_activation_key(key)
        .map_err(|e| format!("Database error: {}", e))?;
    
    if !is_valid {
        return Ok(false);
    }
    
    // Generate a unique device ID
    let device_id = generate_device_id();
    
    // Mark the key as used in the database
    db.mark_key_as_used(key, &device_id)
        .map_err(|e| format!("Failed to mark key as used: {}", e))?;
    
    // Hash the key for secure storage 
    let key_hash = hash_key(key);
    
    // Create activation config
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| format!("Time error: {}", e))?
        .as_secs();
    
    let config = AppConfig {
        activated: true,
        activation_date: now,
        device_id,
        key_hash: key_hash.to_string(),
    };
    
    // Save to config file
    let config_json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    fs::write(config_path, config_json)
        .map_err(|e| format!("Failed to write config file: {}", e))?;
    
    Ok(true)
} 