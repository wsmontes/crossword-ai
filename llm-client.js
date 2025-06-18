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
    }

    setProvider(provider) {
        this.provider = provider;
        this.isConnected = false;
    }

    setModel(model) {
        this.model = model;
    }

    setEndpoint(endpoint) {
        this.endpoint = endpoint;
    }

    setTemperature(temperature) {
        this.temperature = temperature;
    }

    setOpenAIApiKey(apiKey) {
        this.openaiApiKey = apiKey;
        this.isConnected = false;
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
    }

    async testOpenAIConnection() {
        if (!this.openaiApiKey) {
            throw new Error('OpenAI API key is required');
        }

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
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    }

    async generatePuzzle(prompt) {
        if (!this.isConnected) {
            throw new Error('Not connected to AI service');
        }

        try {
            if (this.provider === 'openai') {
                return await this.generatePuzzleOpenAI(prompt);
            } else {
                return await this.generatePuzzleLMStudio(prompt);
            }
        } catch (error) {
            console.error('Error generating puzzle:', error);
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
        if (!this.isConnected) {
            throw new Error('Not connected to AI service');
        }

        const prompt = `Given this crossword clue: "${clue}"
        Current partial answer: "${currentAnswer}" (empty positions shown as spaces)
        
        Please provide a helpful hint that guides the solver toward the answer without giving it away completely.
        Make the hint encouraging and educational.`;

        try {
            if (this.provider === 'openai') {
                return await this.getHintOpenAI(prompt);
            } else {
                return await this.getHintLMStudio(prompt);
            }
        } catch (error) {
            console.error('Error getting hint:', error);
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
        if (!this.isConnected) {
            throw new Error('Not connected to AI service');
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
        if (!this.isConnected) {
            throw new Error('Not connected to AI service');
        }

        try {
            if (this.provider === 'openai') {
                return await this.analyzePuzzleOpenAI(prompt);
            } else {
                return await this.analyzePuzzleLMStudio(prompt);
            }
        } catch (error) {
            console.error('Error analyzing puzzle:', error);
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
