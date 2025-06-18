class SettingsManager {
    constructor() {
        this.storage = new SecureStorage();
        this.settings = this.loadSettings();
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
                this.setSetting('language', e.target.value);
                this.applyLanguageSettings(e.target.value);
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
            lmstudioEndpoint.addEventListener('change', (e) => {
                this.setSetting('lmstudioEndpoint', e.target.value);
                this.dispatchSettingChange('lmstudioEndpoint', e.target.value);
            });
        }

        const openaiKey = document.getElementById('openai-key');
        if (openaiKey) {
            openaiKey.addEventListener('change', (e) => {
                // Store API key securely
                this.storage.setApiKey('openai', e.target.value);
                this.dispatchSettingChange('openaiApiKey', e.target.value);
            });
        }

        // Settings modal/panel toggle
        this.setupSettingsModal();
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
        const aiProviderSelect = document.getElementById('ai-provider-select');
        if (aiProviderSelect) {
            aiProviderSelect.value = this.settings.aiProvider;
            this.updateAIProviderUI(this.settings.aiProvider);
        }

        const lmstudioEndpoint = document.getElementById('lmstudio-endpoint');
        if (lmstudioEndpoint) {
            lmstudioEndpoint.value = this.settings.lmstudioEndpoint;
        }

        // Load stored API key
        const openaiKey = document.getElementById('openai-key');
        if (openaiKey) {
            const storedKey = this.storage.getApiKey('openai');
            if (storedKey) {
                openaiKey.value = storedKey;
            }
        }
    }

    updateAIProviderUI(provider) {
        const lmstudioSettings = document.getElementById('lmstudio-settings');
        const openaiSettings = document.getElementById('openai-settings');
        
        if (lmstudioSettings && openaiSettings) {
            if (provider === 'openai') {
                lmstudioSettings.style.display = 'none';
                openaiSettings.style.display = 'block';
            } else {
                lmstudioSettings.style.display = 'block';
                openaiSettings.style.display = 'none';
            }
        }
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
}
