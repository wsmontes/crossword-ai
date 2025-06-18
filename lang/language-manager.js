class LanguageManager {
    constructor() {
        this.currentLanguage = 'pt'; // Default to Portuguese
        this.languages = {
            'pt': window.pt || {},
            'en': window.en || {}
        };
        this.loadSavedLanguage();
    }
    
    loadSavedLanguage() {
        const saved = localStorage.getItem('crossword-language');
        if (saved && this.languages[saved]) {
            this.currentLanguage = saved;
        }
    }
    
    setLanguage(langCode) {
        if (this.languages[langCode]) {
            this.currentLanguage = langCode;
            localStorage.setItem('crossword-language', langCode);
            this.updateUI();
            return true;
        }
        return false;
    }
    
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    t(key) {
        const keys = key.split('.');
        let value = this.languages[this.currentLanguage];
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Fallback to English if key not found in current language
                value = this.languages['en'];
                for (const fallbackKey of keys) {
                    if (value && typeof value === 'object' && fallbackKey in value) {
                        value = value[fallbackKey];
                    } else {
                        return key; // Return key if not found anywhere
                    }
                }
                break;
            }
        }
        
        return typeof value === 'string' ? value : key;
    }
    
    updateUI() {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const text = this.t(key);
            
            if (element.tagName === 'INPUT' && (element.type === 'button' || element.type === 'submit')) {
                element.value = text;
            } else if (element.tagName === 'INPUT' && element.placeholder !== undefined) {
                element.placeholder = text;
            } else {
                element.textContent = text;
            }
        });
        
        // Update placeholders with data-i18n-placeholder attribute
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const text = this.t(key);
            element.placeholder = text;
        });
        
        // Update aria-labels with data-i18n-aria attribute
        document.querySelectorAll('[data-i18n-aria]').forEach(element => {
            const key = element.getAttribute('data-i18n-aria');
            const text = this.t(key);
            element.setAttribute('aria-label', text);
        });
        
        // Update title
        document.title = this.t('title');
        
        // Update specific UI elements
        this.updateSpecificElements();
    }
    
    updateSpecificElements() {
        // Update language selector
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = this.currentLanguage;
        }
        
        // Update any dynamic content that needs special handling
        const event = new CustomEvent('languageChanged', { 
            detail: { language: this.currentLanguage } 
        });
        document.dispatchEvent(event);
    }
    
    // Helper method to get AI prompts in current language
    getAIPrompt(promptType) {
        return this.t(`aiPrompts.${promptType}`);
    }
    
    // Helper method for formatting strings with variables
    format(key, variables = {}) {
        let text = this.t(key);
        Object.keys(variables).forEach(variable => {
            text = text.replace(`{${variable}}`, variables[variable]);
        });
        return text;
    }
}

// Global instance
window.i18n = new LanguageManager();

// Auto-update UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.i18n.updateUI();
}); 