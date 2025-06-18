class LLMClient {
    constructor() {
        this.provider = 'lmstudio'; // 'lmstudio' or 'openai'
        this.endpoint = 'http://localhost:1234';
        this.model = 'google/gemma-2-9b-it';
        this.temperature = 0.7;
        this.isConnected = false;
        this.lastError = null;
        this.onThinkingUpdate = null;
        
        // OpenAI specific settings
        this.openaiApiKey = '';
        this.openaiModel = 'gpt-3.5-turbo';
        this.openaiEndpoint = 'https://api.openai.com/v1';
        
        // Load stored settings
        this.loadStoredSettings();
    }

    loadStoredSettings() {
        try {
            const storage = new SecureStorage();
            
            // Load OpenAI API key
            const storedApiKey = storage.getApiKey('openai');
            if (storedApiKey) {
                this.openaiApiKey = storedApiKey;
            }
            
            // Load stored provider preference
            const settings = storage.getSettings();
            if (settings.aiProvider) {
                this.provider = settings.aiProvider;
            }
            
            // Load stored endpoints
            const storedEndpoint = storage.getEndpoint('lmstudio');
            if (storedEndpoint) {
                this.endpoint = storedEndpoint;
            }
            
            console.log('LLMClient: Loaded stored settings');
        } catch (error) {
            console.warn('Failed to load stored LLM settings:', error);
        }
    }

    setProvider(provider) {
        this.provider = provider;
        this.isConnected = false;
        
        // Load appropriate settings for the new provider
        if (provider === 'openai') {
            this.loadOpenAISettings();
        } else if (provider === 'lmstudio') {
            this.loadLMStudioSettings();
        }
    }

    loadOpenAISettings() {
        try {
            const storage = new SecureStorage();
            const storedApiKey = storage.getApiKey('openai');
            if (storedApiKey) {
                this.openaiApiKey = storedApiKey;
            }
        } catch (error) {
            console.warn('Failed to load OpenAI settings:', error);
        }
    }

    loadLMStudioSettings() {
        try {
            const storage = new SecureStorage();
            const storedEndpoint = storage.getEndpoint('lmstudio');
            if (storedEndpoint) {
                this.endpoint = storedEndpoint;
            }
        } catch (error) {
            console.warn('Failed to load LM Studio settings:', error);
        }
    }

    setModel(model) {
        this.model = model;
    }

    setEndpoint(endpoint) {
        this.endpoint = endpoint;
        
        // Save to secure storage for LM Studio
        try {
            const storage = new SecureStorage();
            storage.setEndpoint('lmstudio', endpoint);
        } catch (error) {
            console.warn('Failed to save LM Studio endpoint:', error);
        }
    }

    setTemperature(temperature) {
        this.temperature = temperature;
    }

    setOpenAIApiKey(apiKey) {
        this.openaiApiKey = apiKey;
        this.isConnected = false;
        
        // Save to secure storage
        try {
            const storage = new SecureStorage();
            storage.setApiKey('openai', apiKey);
        } catch (error) {
            console.warn('Failed to save OpenAI API key:', error);
        }
    }

    clearOpenAIApiKey() {
        this.openaiApiKey = '';
        this.isConnected = false;
        
        // Remove from secure storage
        try {
            const storage = new SecureStorage();
            storage.clearApiKey('openai');
        } catch (error) {
            console.warn('Failed to clear OpenAI API key:', error);
        }
    }

    setOpenAIModel(model) {
        this.openaiModel = model;
    }

    setThinkingCallback(callback) {
        this.onThinkingUpdate = callback;
    }

    getStatus() {
        return {
            provider: this.provider,
            connected: this.isConnected,
            lastError: this.lastError
        };
    }

    async testConnection() {
        try {
            if (this.provider === 'openai') {
                return await this.testOpenAIConnection();
            } else {
                return await this.testLMStudioConnection();
            }
        } catch (error) {
            this.isConnected = false;
            this.lastError = error.message;
            return { success: false, message: error.message };
        }
    }

    async testLMStudioConnection() {
        try {
            const response = await fetch(`${this.endpoint}/v1/models`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                this.isConnected = true;
                this.lastError = null;
                return { success: true, message: 'Connected to LM Studio' };
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Cannot connect to LM Studio. Please ensure LM Studio is running and accessible.');
            }
            throw error;
        }
    }

    async testOpenAIConnection() {
        if (!this.openaiApiKey) {
            throw new Error('OpenAI API key is required');
        }

        try {
            const response = await fetch(`${this.openaiEndpoint}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                this.isConnected = true;
                this.lastError = null;
                return { success: true, message: 'Connected to OpenAI' };
            } else if (response.status === 401) {
                throw new Error('Invalid OpenAI API key. Please check your API key.');
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Cannot connect to OpenAI. Please check your internet connection.');
            }
            throw error;
        }
    }

    async generatePuzzle(prompt) {
        // Try to connect if not already connected
        if (!this.isConnected) {
            const connectionResult = await this.testConnection();
            if (!connectionResult.success) {
                throw new Error('Not connected to AI service');
            }
        }

        try {
            if (this.provider === 'openai') {
                return await this.generatePuzzleOpenAI(prompt);
            } else {
                return await this.generatePuzzleLMStudio(prompt);
            }
        } catch (error) {
            console.error('Error generating puzzle:', error);
            // Reset connection status on error
            this.isConnected = false;
            throw error;
        }
    }

    async generatePuzzleLMStudio(prompt) {
        const response = await fetch(`${this.endpoint}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: CROSSWORD_GENERATION_PROMPT
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: this.temperature,
                max_tokens: 2000,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async generatePuzzleOpenAI(prompt) {
        const response = await fetch(`${this.openaiEndpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.openaiApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.openaiModel,
                messages: [
                    {
                        role: 'system',
                        content: CROSSWORD_GENERATION_PROMPT
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: this.temperature,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async getHint(clue, currentAnswer) {
        // Try to connect if not already connected
        if (!this.isConnected) {
            const connectionResult = await this.testConnection();
            if (!connectionResult.success) {
                throw new Error('Not connected to AI service');
            }
        }

        // Create language-aware prompt
        const isPortuguese = window.i18n && window.i18n.getCurrentLanguage() === 'pt';
        
        let prompt;
        if (isPortuguese) {
            prompt = `Dada esta pista de palavra cruzada: "${clue}"
            Resposta parcial atual: "${currentAnswer}" (posições vazias mostradas como espaços)
            
            Por favor, forneça uma dica útil que guie o solucionador para a resposta sem revelá-la completamente.
            Torne a dica encorajadora e educativa. Responda em português.`;
        } else {
            prompt = `Given this crossword clue: "${clue}"
            Current partial answer: "${currentAnswer}" (empty positions shown as spaces)
            
            Please provide a helpful hint that guides the solver toward the answer without giving it away completely.
            Make the hint encouraging and educational.`;
        }

        try {
            if (this.provider === 'openai') {
                return await this.getHintOpenAI(prompt);
            } else {
                return await this.getHintLMStudio(prompt);
            }
        } catch (error) {
            console.error('Error getting hint:', error);
            // Reset connection status on error
            this.isConnected = false;
            throw error;
        }
    }

    async getHintLMStudio(prompt) {
        const response = await fetch(`${this.endpoint}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: HINT_GENERATION_PROMPT
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 200,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async getHintOpenAI(prompt) {
        const response = await fetch(`${this.openaiEndpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.openaiApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.openaiModel,
                messages: [
                    {
                        role: 'system',
                        content: HINT_GENERATION_PROMPT
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 200
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async explainAnswer(clue, answer) {
        // Try to connect if not already connected
        if (!this.isConnected) {
            const connectionResult = await this.testConnection();
            if (!connectionResult.success) {
                throw new Error('Not connected to AI service');
            }
        }

        const prompt = `Explain why "${answer}" is the correct answer for the crossword clue: "${clue}"
        
        Provide a clear, educational explanation that helps the solver understand the connection.`;

        try {
            if (this.provider === 'openai') {
                return await this.explainAnswerOpenAI(prompt);
            } else {
                return await this.explainAnswerLMStudio(prompt);
            }
        } catch (error) {
            console.error('Error explaining answer:', error);
            // Reset connection status on error
            this.isConnected = false;
            throw error;
        }
    }

    async explainAnswerLMStudio(prompt) {
        const response = await fetch(`${this.endpoint}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful crossword puzzle assistant. Explain crossword answers clearly and educationally.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.5,
                max_tokens: 300,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async explainAnswerOpenAI(prompt) {
        const response = await fetch(`${this.openaiEndpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.openaiApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.openaiModel,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful crossword puzzle assistant. Explain crossword answers clearly and educationally.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.5,
                max_tokens: 300
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    // Utility method to check if a model is available
    async getAvailableModels() {
        if (!this.isConnected) {
            return [];
        }

        try {
            if (this.provider === 'openai') {
                return await this.getOpenAIModels();
            } else {
                return await this.getLMStudioModels();
            }
        } catch (error) {
            console.error('Error getting models:', error);
            return [];
        }
    }

    async getLMStudioModels() {
        const response = await fetch(`${this.endpoint}/v1/models`);
        if (response.ok) {
            const data = await response.json();
            return data.data.map(model => model.id);
        }
        return [];
    }

    async getOpenAIModels() {
        const response = await fetch(`${this.openaiEndpoint}/models`, {
            headers: {
                'Authorization': `Bearer ${this.openaiApiKey}`,
            }
        });
        if (response.ok) {
            const data = await response.json();
            return data.data.map(model => model.id);
        }
        return [];
    }

    async analyzePuzzle(prompt) {
        // Try to connect if not already connected
        if (!this.isConnected) {
            const connectionResult = await this.testConnection();
            if (!connectionResult.success) {
                throw new Error('Not connected to AI service');
            }
        }

        try {
            if (this.provider === 'openai') {
                return await this.analyzePuzzleOpenAI(prompt);
            } else {
                return await this.analyzePuzzleLMStudio(prompt);
            }
        } catch (error) {
            console.error('Error analyzing puzzle:', error);
            // Reset connection status on error
            this.isConnected = false;
            throw error;
        }
    }

    async analyzePuzzleLMStudio(prompt) {
        const response = await fetch(`${this.endpoint}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert crossword puzzle critic and constructor. Analyze puzzles and provide detailed feedback.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async analyzePuzzleOpenAI(prompt) {
        const response = await fetch(`${this.openaiEndpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.openaiApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.openaiModel,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert crossword puzzle critic and constructor. Analyze puzzles and provide detailed feedback.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
}
