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
            // Generate a browser-specific key for better security
            key = this.generateBrowserKey();
            localStorage.setItem(keyName, key);
        }
        
        return key;
    }

    generateBrowserKey() {
        // Create a more robust key based on browser fingerprint
        const fingerprint = [
            navigator.userAgent.substring(0, 50),
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset().toString()
        ].join('|');
        
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return Math.abs(hash).toString(36);
    }

    // Improved XOR encryption with better error handling
    encrypt(text) {
        if (!text) return '';
        
        try {
            let result = '';
            for (let i = 0; i < text.length; i++) {
                const textChar = text.charCodeAt(i);
                const keyChar = this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
                result += String.fromCharCode(textChar ^ keyChar);
            }
            
            return btoa(result); // Base64 encode
        } catch (error) {
            console.error('Encryption error:', error);
            return '';
        }
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

    // Simplified API key management
    setApiKey(provider, apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            this.remove(`api_key_${provider}`);
            return;
        }
        
        this.set(`api_key_${provider}`, apiKey.trim());
    }

    getApiKey(provider) {
        return this.get(`api_key_${provider}`) || '';
    }

    clearApiKey(provider) {
        this.remove(`api_key_${provider}`);
    }

    // Settings management
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

    // Endpoint management
    setEndpoint(provider, endpoint) {
        this.set(`endpoint_${provider}`, endpoint);
    }

    getEndpoint(provider) {
        return this.get(`endpoint_${provider}`) || '';
    }

    // Statistics tracking
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

    // Puzzle progress management
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

    // Utility methods
    getStorageUsage() {
        let totalSize = 0;
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                totalSize += localStorage.getItem(key).length;
            }
        });
        return totalSize;
    }

    // Data export/import
    exportData() {
        const data = {};
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                data[key] = localStorage.getItem(key);
            }
        });
        return JSON.stringify(data);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            Object.keys(data).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.setItem(key, data[key]);
                }
            });
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    // Cleanup old data
    cleanupOldData(daysOld = 30) {
        const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.prefix + 'puzzle_')) {
                try {
                    const data = JSON.parse(this.decrypt(localStorage.getItem(key)));
                    if (data.timestamp && data.timestamp < cutoffTime) {
                        localStorage.removeItem(key);
                    }
                } catch (error) {
                    // Remove corrupted data
                    localStorage.removeItem(key);
                }
            }
        });
    }
}
