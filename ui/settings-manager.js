class SettingsManager {
    constructor() {
        this.storage = new SecureStorage();
        this.settings = this.loadSettings();
        this.apiKeyInputTimeout = null;
        this.setupEventListeners();
        this.applySettings();
    }

    loadSettings() {
        const defaultSettings = {
            // Game settings
            difficulty: 'medium',
            gridSize: 'medium',
            autoCheck: true,
            showMistakes: false,
            
            // Language settings
            language: 'pt', // Default to Portuguese
            
            // AI settings
            aiProvider: 'lmstudio',
            lmstudioEndpoint: 'http://localhost:1234',
            lmstudioModel: 'google/gemma-2-9b-it',
            openaiModel: 'gpt-3.5-turbo',
            
            // UI settings
            theme: 'light',
            fontSize: 'medium',
            showTimer: true,
            showProgress: true,
            
            // Accessibility
            highContrast: false,
            announceAnswers: false,
            keyboardNavigation: true,
            
            // Advanced
            temperature: 0.7,
            maxTokens: 2000,
            autoSave: true,
            saveProgress: true
        };

        const savedSettings = this.storage.getSettings();
        return { ...defaultSettings, ...savedSettings };
    }

    saveSettings() {
        this.storage.setSettings(this.settings);
    }

    setupEventListeners() {
        // Game settings
        const difficultySelect = document.getElementById('difficulty-select');
        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                this.setSetting('difficulty', e.target.value);
            });
        }

        const gridSizeSelect = document.getElementById('grid-size-select');
        if (gridSizeSelect) {
            gridSizeSelect.addEventListener('change', (e) => {
                this.setSetting('gridSize', e.target.value);
            });
        }

        const autoCheckbox = document.getElementById('auto-check');
        if (autoCheckbox) {
            autoCheckbox.addEventListener('change', (e) => {
                this.setSetting('autoCheck', e.target.checked);
            });
        }

        const showMistakesCheckbox = document.getElementById('show-mistakes');
        if (showMistakesCheckbox) {
            showMistakesCheckbox.addEventListener('change', (e) => {
                this.setSetting('showMistakes', e.target.checked);
            });
        }

        // Language settings
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                const lang = e.target.value;
                this.setSetting('language', lang);
                this.applyLanguageSettings(lang);
                
                // Force immediate UI update
                if (window.i18n) {
                    window.i18n.setLanguage(lang);
                }
            });
        }

        // AI settings
        const aiProviderSelect = document.getElementById('ai-provider-select');
        if (aiProviderSelect) {
            aiProviderSelect.addEventListener('change', (e) => {
                this.setSetting('aiProvider', e.target.value);
                this.updateAIProviderUI(e.target.value);
                this.dispatchSettingChange('aiProvider', e.target.value);
            });
        }

        const lmstudioEndpoint = document.getElementById('lmstudio-endpoint');
        if (lmstudioEndpoint) {
            const saveEndpoint = (e) => {
                const value = e.target.value.trim();
                this.setSetting('lmstudioEndpoint', value);
                this.dispatchSettingChange('lmstudioEndpoint', value);
            };
            
            lmstudioEndpoint.addEventListener('change', saveEndpoint);
            lmstudioEndpoint.addEventListener('blur', saveEndpoint);
        }

        const openaiKey = document.getElementById('openai-key');
        if (openaiKey) {
            let lastSavedKey = this.storage.getApiKey('openai');
            
            // Simplified save function
            const saveApiKey = (value) => {
                // Skip saving if the value hasn't actually changed
                if (value === lastSavedKey) {
                    return;
                }
                
                const statusElement = document.getElementById('openai-key-status');
                
                if (statusElement) {
                    statusElement.textContent = window.i18n ? window.i18n.t('saving') : 'Saving...';
                    statusElement.className = 'input-status visible saving';
                }
                
                this.storage.setApiKey('openai', value);
                lastSavedKey = value;
                
                // Show success message briefly
                setTimeout(() => {
                    if (statusElement) {
                        statusElement.textContent = window.i18n ? window.i18n.t('saved') : 'Saved';
                        statusElement.className = 'input-status visible success';
                        
                        // Hide after 2 seconds
                        setTimeout(() => {
                            statusElement.className = 'input-status';
                        }, 2000);
                    }
                }, 300);
                
                this.updateConnectionInfo();
                this.dispatchSettingChange('openaiApiKey', value);
            };
            
            // Save on blur (when user finishes editing)
            openaiKey.addEventListener('blur', (e) => {
                saveApiKey(e.target.value.trim());
            });
            
            // Optional: Add debounced input for real-time saving
            openaiKey.addEventListener('input', (e) => {
                clearTimeout(this.apiKeyInputTimeout);
                this.apiKeyInputTimeout = setTimeout(() => {
                    saveApiKey(e.target.value.trim());
                }, 1500);
            });
        }

        // Clear OpenAI API key button
        const clearOpenaiKeyBtn = document.getElementById('clear-openai-key-btn');
        if (clearOpenaiKeyBtn) {
            clearOpenaiKeyBtn.addEventListener('click', () => {
                this.clearOpenAIApiKey();
            });
        }

        // Settings modal/panel toggle
        this.setupSettingsModal();
        
        // Save buttons
        const saveSettingsBtn = document.getElementById('save-settings-btn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveAllSettings();
                this.closeModal('settings-modal');
                this.showNotification(window.i18n ? window.i18n.t('settingsSaved') : 'Settings saved!');
            });
        }
        
        const saveAISettingsBtn = document.getElementById('save-ai-settings-btn');
        if (saveAISettingsBtn) {
            saveAISettingsBtn.addEventListener('click', () => {
                this.saveAllSettings();
                this.closeModal('ai-settings-modal');
                this.showNotification(window.i18n ? window.i18n.t('settingsSaved') : 'AI settings saved!');
            });
        }
    }

    setSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.applySettings();
        this.dispatchSettingChange(key, value);
    }

    getSetting(key) {
        return this.settings[key];
    }

    applySettings() {
        this.applyGameSettings();
        this.applyLanguageSettings();
        this.applyUISettings();
        this.applyAccessibilitySettings();
        this.applyAISettings();
    }

    applyGameSettings() {
        // Set form values
        const difficultySelect = document.getElementById('difficulty-select');
        if (difficultySelect) {
            difficultySelect.value = this.settings.difficulty;
        }

        const gridSizeSelect = document.getElementById('grid-size-select');
        if (gridSizeSelect) {
            gridSizeSelect.value = this.settings.gridSize;
        }

        const autoCheckbox = document.getElementById('auto-check');
        if (autoCheckbox) {
            autoCheckbox.checked = this.settings.autoCheck;
        }

        const showMistakesCheckbox = document.getElementById('show-mistakes');
        if (showMistakesCheckbox) {
            showMistakesCheckbox.checked = this.settings.showMistakes;
        }
    }

    applyLanguageSettings(language = null) {
        const lang = language || this.settings.language;
        
        // Set the language select value
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = lang;
        }
        
        // Apply language through the language manager if available
        if (window.i18n) {
            window.i18n.setLanguage(lang);
        }
        
        // Update HTML lang attribute
        document.documentElement.lang = lang;
    }

    applyUISettings() {
        // Apply theme
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        
        // Apply font size
        document.documentElement.style.setProperty('--base-font-size', 
            this.getFontSizeValue(this.settings.fontSize));
        
        // Show/hide UI elements
        const timerElements = document.querySelectorAll('.timer');
        timerElements.forEach(el => {
            el.style.display = this.settings.showTimer ? 'block' : 'none';
        });
        
        const progressElements = document.querySelectorAll('.progress-section');
        progressElements.forEach(el => {
            el.style.display = this.settings.showProgress ? 'block' : 'none';
        });
    }

    applyAccessibilitySettings() {
        // High contrast mode
        if (this.settings.highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
        
        // Keyboard navigation
        if (this.settings.keyboardNavigation) {
            document.body.classList.add('keyboard-navigation');
        } else {
            document.body.classList.remove('keyboard-navigation');
        }
    }

    applyAISettings() {
        // Set AI provider
        const aiProviderSelect = document.getElementById('ai-provider-select');
        if (aiProviderSelect) {
            aiProviderSelect.value = this.settings.aiProvider;
        }

        // Set LM Studio endpoint
        const lmstudioEndpoint = document.getElementById('lmstudio-endpoint');
        if (lmstudioEndpoint) {
            lmstudioEndpoint.value = this.settings.lmstudioEndpoint;
        }

        // Load OpenAI API key from secure storage
        const openaiKey = document.getElementById('openai-key');
        if (openaiKey) {
            try {
                const storedApiKey = this.storage.getApiKey('openai');
                if (window.DEBUG_STORAGE) {
                    console.log('Loading OpenAI API key from storage...');
                    console.log('Loaded key:', storedApiKey ? `${storedApiKey.substring(0, 8)}...` : 'null');
                    console.log('Loaded key length:', storedApiKey ? storedApiKey.length : 0);
                }
                
                // Always set the value, even if it's empty
                openaiKey.value = storedApiKey || '';
            } catch (error) {
                console.warn('Failed to load OpenAI API key:', error);
                openaiKey.value = '';
            }
        }

        // Update UI based on provider
        this.updateAIProviderUI(this.settings.aiProvider);
        
        // Update connection info
        this.updateConnectionInfo();
    }

    updateAIProviderUI(provider) {
        const lmstudioSettings = document.getElementById('lmstudio-settings');
        const openaiSettings = document.getElementById('openai-settings');
        
        if (provider === 'lmstudio') {
            if (lmstudioSettings) lmstudioSettings.style.display = 'block';
            if (openaiSettings) openaiSettings.style.display = 'none';
        } else {
            if (lmstudioSettings) lmstudioSettings.style.display = 'none';
            if (openaiSettings) openaiSettings.style.display = 'block';
        }
        
        // Update connection info
        this.updateConnectionInfo();
    }

    getFontSizeValue(size) {
        const sizes = {
            small: '12px',
            medium: '14px',
            large: '16px',
            xlarge: '18px'
        };
        return sizes[size] || sizes.medium;
    }

    dispatchSettingChange(key, value) {
        document.dispatchEvent(new CustomEvent('settingChanged', {
            detail: { key, value }
        }));
    }

    // Auto-check settings
    getAutoCheck() {
        return this.settings.autoCheck;
    }

    setAutoCheck(enabled) {
        this.setSetting('autoCheck', enabled);
    }

    // Show mistakes settings
    getShowMistakes() {
        return this.settings.showMistakes;
    }

    setShowMistakes(enabled) {
        this.setSetting('showMistakes', enabled);
    }

    // Theme management
    setTheme(theme) {
        this.setSetting('theme', theme);
    }

    getTheme() {
        return this.settings.theme;
    }

    toggleTheme() {
        const currentTheme = this.getTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    // Advanced settings modal
    setupSettingsModal() {
        // Create settings button if it doesn't exist
        const existingBtn = document.getElementById('advanced-settings-btn');
        if (!existingBtn) {
            const settingsBtn = document.createElement('button');
            settingsBtn.id = 'advanced-settings-btn';
            settingsBtn.className = 'btn btn-secondary';
            settingsBtn.innerHTML = '<i class="fas fa-cog"></i> Advanced Settings';
            settingsBtn.addEventListener('click', () => this.showAdvancedSettings());
            
            const settingsSection = document.querySelector('.ai-settings-section');
            if (settingsSection) {
                settingsSection.appendChild(settingsBtn);
            }
        }
    }

    showAdvancedSettings() {
        // Create modal if it doesn't exist
        let modal = document.getElementById('advanced-settings-modal');
        if (!modal) {
            modal = this.createAdvancedSettingsModal();
            document.body.appendChild(modal);
        }
        
        modal.classList.add('active');
    }

    createAdvancedSettingsModal() {
        const modal = document.createElement('div');
        modal.id = 'advanced-settings-modal';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <h2><i class="fas fa-cog"></i> Advanced Settings</h2>
                
                <div class="settings-group">
                    <h3>UI Settings</h3>
                    <label>
                        Theme:
                        <select id="theme-select">
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                        </select>
                    </label>
                    
                    <label>
                        Font Size:
                        <select id="font-size-select">
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                            <option value="xlarge">Extra Large</option>
                        </select>
                    </label>
                    
                    <label>
                        <input type="checkbox" id="show-timer-checkbox">
                        Show Timer
                    </label>
                    
                    <label>
                        <input type="checkbox" id="show-progress-checkbox">
                        Show Progress
                    </label>
                </div>
                
                <div class="settings-group">
                    <h3>Accessibility</h3>
                    <label>
                        <input type="checkbox" id="high-contrast-checkbox">
                        High Contrast Mode
                    </label>
                    
                    <label>
                        <input type="checkbox" id="announce-answers-checkbox">
                        Announce Answers
                    </label>
                    
                    <label>
                        <input type="checkbox" id="keyboard-navigation-checkbox">
                        Enhanced Keyboard Navigation
                    </label>
                </div>
                
                <div class="settings-group">
                    <h3>AI Configuration</h3>
                    <label>
                        Temperature:
                        <input type="range" id="temperature-slider" min="0" max="1" step="0.1" value="0.7">
                        <span id="temperature-value">0.7</span>
                    </label>
                    
                    <label>
                        Max Tokens:
                        <input type="number" id="max-tokens-input" min="100" max="4000" value="2000">
                    </label>
                </div>
                
                <div class="settings-group">
                    <h3>Data Management</h3>
                    <label>
                        <input type="checkbox" id="auto-save-checkbox">
                        Auto-save Progress
                    </label>
                    
                    <label>
                        <input type="checkbox" id="save-progress-checkbox">
                        Save Progress Between Sessions
                    </label>
                    
                    <button class="btn btn-secondary" id="export-data-btn">
                        <i class="fas fa-download"></i> Export Data
                    </button>
                    
                    <button class="btn btn-secondary" id="import-data-btn">
                        <i class="fas fa-upload"></i> Import Data
                    </button>
                    
                    <button class="btn btn-danger" id="reset-data-btn">
                        <i class="fas fa-trash"></i> Reset All Data
                    </button>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-primary" id="save-advanced-settings-btn">Save Settings</button>
                    <button class="btn btn-secondary" id="close-advanced-settings-btn">Close</button>
                </div>
            </div>
        `;
        
        // Add event listeners for advanced settings
        this.setupAdvancedSettingsEventListeners(modal);
        
        return modal;
    }

    setupAdvancedSettingsEventListeners(modal) {
        // Close modal
        modal.querySelector('#close-advanced-settings-btn').addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        // Save settings
        modal.querySelector('#save-advanced-settings-btn').addEventListener('click', () => {
            this.saveAdvancedSettings(modal);
            modal.classList.remove('active');
        });
        
        // Temperature slider
        const tempSlider = modal.querySelector('#temperature-slider');
        const tempValue = modal.querySelector('#temperature-value');
        tempSlider.addEventListener('input', (e) => {
            tempValue.textContent = e.target.value;
        });
        
        // Data management buttons
        modal.querySelector('#export-data-btn').addEventListener('click', () => {
            this.exportData();
        });
        
        modal.querySelector('#import-data-btn').addEventListener('click', () => {
            this.importData();
        });
        
        modal.querySelector('#reset-data-btn').addEventListener('click', () => {
            this.confirmResetData();
        });
        
        // Load current values
        this.loadAdvancedSettingsValues(modal);
    }

    loadAdvancedSettingsValues(modal) {
        modal.querySelector('#theme-select').value = this.settings.theme;
        modal.querySelector('#font-size-select').value = this.settings.fontSize;
        modal.querySelector('#show-timer-checkbox').checked = this.settings.showTimer;
        modal.querySelector('#show-progress-checkbox').checked = this.settings.showProgress;
        modal.querySelector('#high-contrast-checkbox').checked = this.settings.highContrast;
        modal.querySelector('#announce-answers-checkbox').checked = this.settings.announceAnswers;
        modal.querySelector('#keyboard-navigation-checkbox').checked = this.settings.keyboardNavigation;
        modal.querySelector('#temperature-slider').value = this.settings.temperature;
        modal.querySelector('#temperature-value').textContent = this.settings.temperature;
        modal.querySelector('#max-tokens-input').value = this.settings.maxTokens;
        modal.querySelector('#auto-save-checkbox').checked = this.settings.autoSave;
        modal.querySelector('#save-progress-checkbox').checked = this.settings.saveProgress;
    }

    saveAdvancedSettings(modal) {
        this.settings.theme = modal.querySelector('#theme-select').value;
        this.settings.fontSize = modal.querySelector('#font-size-select').value;
        this.settings.showTimer = modal.querySelector('#show-timer-checkbox').checked;
        this.settings.showProgress = modal.querySelector('#show-progress-checkbox').checked;
        this.settings.highContrast = modal.querySelector('#high-contrast-checkbox').checked;
        this.settings.announceAnswers = modal.querySelector('#announce-answers-checkbox').checked;
        this.settings.keyboardNavigation = modal.querySelector('#keyboard-navigation-checkbox').checked;
        this.settings.temperature = parseFloat(modal.querySelector('#temperature-slider').value);
        this.settings.maxTokens = parseInt(modal.querySelector('#max-tokens-input').value);
        this.settings.autoSave = modal.querySelector('#auto-save-checkbox').checked;
        this.settings.saveProgress = modal.querySelector('#save-progress-checkbox').checked;
        
        this.saveSettings();
        this.applySettings();
    }

    exportData() {
        const data = this.storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `crossword-ai-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const success = this.storage.importData(e.target.result);
                        if (success) {
                            alert('Data imported successfully!');
                            location.reload(); // Reload to apply imported settings
                        } else {
                            alert('Failed to import data. Please check the file format.');
                        }
                    } catch (error) {
                        alert('Error importing data: ' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        });
        
        input.click();
    }

    confirmResetData() {
        if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
            this.storage.clear();
            alert('All data has been reset.');
            location.reload();
        }
    }

    // Utility methods
    resetToDefaults() {
        this.settings = this.loadSettings();
        this.saveSettings();
        this.applySettings();
    }

    getStorageUsage() {
        return this.storage.getStorageUsage();
    }

    clearOpenAIApiKey() {
        // Clear from secure storage
        this.storage.clearApiKey('openai');
        
        // Clear from input field
        const openaiKey = document.getElementById('openai-key');
        if (openaiKey) {
            openaiKey.value = '';
        }
        
        // Update connection info
        this.updateConnectionInfo();
        
        // Dispatch setting change
        this.dispatchSettingChange('openaiApiKey', '');
    }

    updateConnectionInfo() {
        const currentProvider = document.getElementById('current-provider');
        const apiKeyStatus = document.getElementById('api-key-status-text');
        
        if (currentProvider) {
            const provider = this.settings.aiProvider || 'lmstudio';
            currentProvider.textContent = provider === 'openai' ? 'OpenAI' : 'LM Studio';
        }
        
        if (apiKeyStatus) {
            if (this.settings.aiProvider === 'openai') {
                const apiKey = this.storage.getApiKey('openai');
                if (apiKey) {
                    apiKeyStatus.textContent = 'Set';
                    apiKeyStatus.className = 'info-value success';
                } else {
                    apiKeyStatus.textContent = 'Not set';
                    apiKeyStatus.className = 'info-value error';
                }
            } else {
                apiKeyStatus.textContent = 'N/A';
                apiKeyStatus.className = 'info-value';
            }
        }
        
        // Ensure OpenAI API key field is populated when modal is shown
        const openaiKey = document.getElementById('openai-key');
        if (openaiKey) {
            try {
                const storedApiKey = this.storage.getApiKey('openai');
                if (storedApiKey && !openaiKey.value) {
                    openaiKey.value = storedApiKey;
                }
            } catch (error) {
                console.warn('Failed to load OpenAI API key into field:', error);
            }
        }
    }
    
    saveAllSettings() {
        // Save OpenAI API key from input field if present
        const openaiKey = document.getElementById('openai-key');
        if (openaiKey && openaiKey.value.trim()) {
            this.storage.setApiKey('openai', openaiKey.value.trim());
            
            // Show visual confirmation
            const statusElement = document.getElementById('openai-key-status');
            if (statusElement) {
                statusElement.textContent = window.i18n ? window.i18n.t('saved') : 'Saved';
                statusElement.className = 'input-status visible success';
                setTimeout(() => {
                    statusElement.className = 'input-status';
                }, 2000);
            }
        }
        
        // Save LM Studio endpoint from input field if present
        const lmstudioEndpoint = document.getElementById('lmstudio-endpoint');
        if (lmstudioEndpoint && lmstudioEndpoint.value.trim()) {
            this.setSetting('lmstudioEndpoint', lmstudioEndpoint.value.trim());
        }
        
        // This method saves all current settings and applies them
        this.saveSettings();
        this.applySettings();
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    showNotification(message) {
        // Try to use the main app's notification system
        if (window.crosswordUI && window.crosswordUI.showNotification) {
            window.crosswordUI.showNotification(message);
        } else {
            // Fallback to simple alert or console
            console.log(message);
        }
    }
}
