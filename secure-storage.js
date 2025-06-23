// Secure storage for API keys and sensitive data
class SecureStorage {
    constructor() {
        this.prefix = 'crossword_ai_';
        this.encryptionKey = this.getOrCreateEncryptionKey();
    }

    getOrCreateEncryptionKey() {
        const keyName = this.prefix + 'enc_key';
        let key = localStorage.getItem(keyName);
        
        if (!key) {
            // Generate a simple key for basic obfuscation
            key = this.generateKey();
            localStorage.setItem(keyName, key);
        }
        
        return key;
    }

    generateKey() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    // Simple XOR encryption for basic obfuscation
    encrypt(text) {
        if (!text) return '';
        
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const textChar = text.charCodeAt(i);
            const keyChar = this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
            result += String.fromCharCode(textChar ^ keyChar);
        }
        
        return btoa(result); // Base64 encode
    }

    decrypt(encryptedText) {
        if (!encryptedText) return '';
        
        try {
            const text = atob(encryptedText); // Base64 decode
            let result = '';
            
            for (let i = 0; i < text.length; i++) {
                const textChar = text.charCodeAt(i);
                const keyChar = this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
                result += String.fromCharCode(textChar ^ keyChar);
            }
            
            return result;
        } catch (error) {
            console.warn('Failed to decrypt data:', error);
            return '';
        }
    }

    set(key, value) {
        const fullKey = this.prefix + key;
        const encryptedValue = this.encrypt(value);
        localStorage.setItem(fullKey, encryptedValue);
    }

    get(key) {
        const fullKey = this.prefix + key;
        const encryptedValue = localStorage.getItem(fullKey);
        return this.decrypt(encryptedValue);
    }

    remove(key) {
        const fullKey = this.prefix + key;
        localStorage.removeItem(fullKey);
    }

    clear() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
    }

    has(key) {
        const fullKey = this.prefix + key;
        return localStorage.getItem(fullKey) !== null;
    }

    // Specific methods for common data
    setApiKey(provider, apiKey) {
        // Only log if debug mode is enabled
        if (window.DEBUG_STORAGE) {
            console.log(`SecureStorage: Setting API key for ${provider}`);
            console.log(`SecureStorage: Key value:`, apiKey ? `${apiKey.substring(0, 8)}...` : 'null');
            console.log(`SecureStorage: Key length:`, apiKey ? apiKey.length : 0);
        }
        
        this.set(`api_key_${provider}`, apiKey);
        
        // Verify it was stored (only in debug mode)
        if (window.DEBUG_STORAGE) {
            const stored = this.get(`api_key_${provider}`);
            console.log(`SecureStorage: Verification - stored key:`, stored ? `${stored.substring(0, 8)}...` : 'null');
        }
    }

    getApiKey(provider) {
        const key = this.get(`api_key_${provider}`);
        
        // Only log if debug mode is enabled
        if (window.DEBUG_STORAGE) {
            console.log(`SecureStorage: Getting API key for ${provider}`);
            console.log(`SecureStorage: Retrieved key:`, key ? `${key.substring(0, 8)}...` : 'null');
            console.log(`SecureStorage: Retrieved key length:`, key ? key.length : 0);
        }
        
        return key;
    }

    clearApiKey(provider) {
        this.remove(`api_key_${provider}`);
    }

    setEndpoint(provider, endpoint) {
        this.set(`endpoint_${provider}`, endpoint);
    }

    getEndpoint(provider) {
        return this.get(`endpoint_${provider}`);
    }

    setSettings(settings) {
        this.set('settings', JSON.stringify(settings));
    }

    getSettings() {
        const settingsJson = this.get('settings');
        if (settingsJson) {
            try {
                return JSON.parse(settingsJson);
            } catch (error) {
                console.warn('Failed to parse settings:', error);
                return {};
            }
        }
        return {};
    }

    // Statistics and progress tracking
    setStats(stats) {
        this.set('stats', JSON.stringify(stats));
    }

    getStats() {
        const statsJson = this.get('stats');
        if (statsJson) {
            try {
                return JSON.parse(statsJson);
            } catch (error) {
                console.warn('Failed to parse stats:', error);
                return this.getDefaultStats();
            }
        }
        return this.getDefaultStats();
    }

    getDefaultStats() {
        return {
            puzzlesCompleted: 0,
            totalHintsUsed: 0,
            averageCompletionTime: 0,
            bestTime: null,
            currentStreak: 0,
            longestStreak: 0,
            difficulty: {
                easy: { completed: 0, bestTime: null },
                medium: { completed: 0, bestTime: null },
                hard: { completed: 0, bestTime: null }
            }
        };
    }

    updateStats(newStats) {
        const currentStats = this.getStats();
        const updatedStats = { ...currentStats, ...newStats };
        this.setStats(updatedStats);
    }

    // Save and load puzzle progress
    savePuzzleProgress(puzzleId, progress) {
        this.set(`puzzle_${puzzleId}`, JSON.stringify(progress));
    }

    loadPuzzleProgress(puzzleId) {
        const progressJson = this.get(`puzzle_${puzzleId}`);
        if (progressJson) {
            try {
                return JSON.parse(progressJson);
            } catch (error) {
                console.warn('Failed to parse puzzle progress:', error);
                return null;
            }
        }
        return null;
    }

    deletePuzzleProgress(puzzleId) {
        this.remove(`puzzle_${puzzleId}`);
    }

    // Get all saved puzzle IDs
    getSavedPuzzles() {
        const keys = Object.keys(localStorage);
        const puzzleKeys = keys.filter(key => 
            key.startsWith(this.prefix + 'puzzle_') && 
            !key.includes('_stats')
        );
        
        return puzzleKeys.map(key => 
            key.replace(this.prefix + 'puzzle_', '')
        );
    }

    // Clean up old data
    cleanupOldData(daysOld = 30) {
        const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.prefix + 'puzzle_')) {
                try {
                    const data = JSON.parse(this.decrypt(localStorage.getItem(key)));
                    if (data.timestamp && data.timestamp < cutoffDate) {
                        localStorage.removeItem(key);
                    }
                } catch (error) {
                    // If we can't parse it, it might be corrupt, so remove it
                    localStorage.removeItem(key);
                }
            }
        });
    }

    // Export/Import functionality for backup
    exportData() {
        const data = {};
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.prefix) && !key.includes('enc_key')) {
                const rawKey = key.replace(this.prefix, '');
                data[rawKey] = this.decrypt(localStorage.getItem(key));
            }
        });
        
        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            Object.entries(data).forEach(([key, value]) => {
                this.set(key, value);
            });
            
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    // Memory usage estimation
    getStorageUsage() {
        let totalSize = 0;
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                totalSize += key.length + (localStorage.getItem(key) || '').length;
            }
        });
        
        return {
            bytes: totalSize,
            kb: Math.round(totalSize / 1024 * 100) / 100,
            mb: Math.round(totalSize / (1024 * 1024) * 100) / 100
        };
    }
}
