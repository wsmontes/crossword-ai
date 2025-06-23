// Main application initialization
class CrosswordApp {
    constructor() {
        this.initialized = false; // Add initialization guard
        this.engine = null;
        this.llmClient = null;
        this.ui = null;
        this.startTime = null;
        this.hintsUsed = 0;
        this.currentTheme = null;
        this.settingsManager = null;
        this.currentPuzzle = null;
        this.connectionTestTimeout = null; // For debouncing connection tests
        
        // Initialize app when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        // Prevent double initialization
        if (this.initialized) {
            console.warn('App already initialized, skipping...');
            return;
        }
        this.initialized = true;
        
        console.log('Initializing Crossword Puzzle AI...');
        this.initializeApp();
    }

    async initializeApp() {
        try {
            // Clean up old stored API keys on startup
            this.cleanupSecureStorage();

            // Initialize language system first
            this.initializeLanguageSystem();

            // Initialize settings manager
            this.settingsManager = new SettingsManager();

            // Initialize crossword engine
            this.engine = new CrosswordEngine();
            console.log('Crossword engine initialized');

            // Initialize LLM client
            this.llmClient = new LLMClient();
            console.log('LLM client initialized');

            // Initialize UI
            this.ui = new CrosswordUI(this.engine, this.llmClient);
            console.log('Crossword UI initialized');

            // Set up event listeners
            this.setupEventListeners();

            // Show loading screen and try to auto-connect to AI
            this.showLoadingScreen();
            await this.autoConnectToAI();

            // Generate initial puzzle automatically
            await this.generateNewPuzzle();

            // Auto-select the first word when puzzle is ready
            this.autoSelectFirstWord();

            // Initialize theme toggle
            this.initializeThemeToggle();

            // Add global error handler
            window.addEventListener('error', (event) => {
                console.error('Global error:', event.error);
                this.handleGlobalError(event.error);
            });

            // Add unhandled promise rejection handler
            window.addEventListener('unhandledrejection', (event) => {
                console.error('Unhandled promise rejection:', event.reason);
                this.handleGlobalError(event.reason);
            });

            console.log('Crossword Puzzle AI application initialized successfully');

        } catch (error) {
            console.error('Failed to initialize application:', error);
            const message = window.i18n ? window.i18n.t('failedToInitialize') : 'Failed to initialize application. Please refresh the page.';
            this.showNotification(message, 'error');
        } finally {
            this.hideLoadingScreen();
        }
    }

    setupEventListeners() {
        // New puzzle button (both regular and FAB)
        const newPuzzleBtn = document.getElementById('new-puzzle-btn');
        const fabNewPuzzle = document.getElementById('fab-new-puzzle');
        if (newPuzzleBtn) newPuzzleBtn.addEventListener('click', () => this.generateNewPuzzle());
        if (fabNewPuzzle) fabNewPuzzle.addEventListener('click', () => this.generateNewPuzzle());

        // Hint button
        const hintBtn = document.getElementById('hint-btn');
        if (hintBtn) {
            hintBtn.addEventListener('click', () => this.getHint());
        }

        // Check answers button
        const checkBtn = document.getElementById('check-btn');
        if (checkBtn) {
            checkBtn.addEventListener('click', () => this.checkAnswers());
        }

        // Settings modal
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showModal('settings-modal'));
        }

        // AI Settings modal
        const aiSettingsBtn = document.getElementById('ai-settings-btn');
        if (aiSettingsBtn) {
            aiSettingsBtn.addEventListener('click', () => this.showModal('ai-settings-modal'));
        }

        // Modal close handlers
        document.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-dismiss') && e.target.getAttribute('data-dismiss') === 'modal') {
                const modal = e.target.closest('.modal');
                if (modal) this.closeModal(modal.id);
            }
        });

        // Close modal when clicking backdrop
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                const modal = e.target.closest('.modal');
                if (modal) this.closeModal(modal.id);
            }
        });

        // Clue tabs
        const acrossTab = document.getElementById('across-tab');
        const downTab = document.getElementById('down-tab');
        if (acrossTab) acrossTab.addEventListener('click', () => this.switchClueTab('across'));
        if (downTab) downTab.addEventListener('click', () => this.switchClueTab('down'));

        // Settings
        const difficultySelect = document.getElementById('difficulty-select');
        const gridSizeSelect = document.getElementById('grid-size-select');
        const languageSelect = document.getElementById('language-select');
        
        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                this.engine.setDifficulty(e.target.value);
                this.settingsManager.setSetting('difficulty', e.target.value);
            });
        }

        if (gridSizeSelect) {
            gridSizeSelect.addEventListener('change', (e) => {
                this.engine.setGridSize(e.target.value);
                this.settingsManager.setSetting('gridSize', e.target.value);
            });
        }

        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.settingsManager.setSetting('language', e.target.value);
                // Implement language switching logic here
                this.updateLanguage(e.target.value);
            });
        }

        // Checkboxes
        const autoCheckBox = document.getElementById('auto-check');
        const showMistakesBox = document.getElementById('show-mistakes');
        
        if (autoCheckBox) {
            autoCheckBox.addEventListener('change', (e) => {
                this.settingsManager.setSetting('autoCheck', e.target.checked);
            });
        }

        if (showMistakesBox) {
            showMistakesBox.addEventListener('change', (e) => {
                this.settingsManager.setSetting('showMistakes', e.target.checked);
            });
        }

        // AI settings
        const aiProviderSelect = document.getElementById('ai-provider-select');
        const testConnectionBtn = document.getElementById('test-connection-btn');
        
        if (aiProviderSelect) {
            aiProviderSelect.addEventListener('change', (e) => {
                this.handleProviderChange(e.target.value);
            });
        }

        if (testConnectionBtn) {
            testConnectionBtn.addEventListener('click', () => this.testAIConnection());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Handle puzzle completion event
        document.addEventListener('puzzleCompleted', (e) => {
            this.handlePuzzleComplete();
        });
        
        // Handle settings changes
        document.addEventListener('settingChanged', (e) => {
            this.handleSettingChange(e.detail.key, e.detail.value);
        });

        // Word input submit
        const submitWordBtn = document.getElementById('submit-word-btn');
        if (submitWordBtn) {
            submitWordBtn.addEventListener('click', () => this.ui.submitCurrentWord());
        }

        // Word input enter key
        const wordInput = document.getElementById('word-input');
        if (wordInput) {
            wordInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.ui.submitCurrentWord();
                }
            });
        }

        // Completion modal new puzzle button
        const newPuzzleModalBtn = document.getElementById('new-puzzle-modal-btn');
        if (newPuzzleModalBtn) {
            newPuzzleModalBtn.addEventListener('click', () => {
                this.closeModal('completion-modal');
                this.generateNewPuzzle();
            });
        }
    }

    initializeThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const currentTheme = localStorage.getItem('theme') || 'light';
        
        // Set initial theme
        document.body.setAttribute('data-theme', currentTheme);
        this.updateThemeToggleIcon(currentTheme);
        
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const newTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                document.body.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                this.updateThemeToggleIcon(newTheme);
            });
        }
    }

    updateThemeToggleIcon(theme) {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    async generateNewPuzzle() {
        try {
            this.hintsUsed = 0;
            this.startTime = Date.now();

            this.showLoadingScreen();
            this.updateLoadingStep('connect', 'Connecting to AI...');

            // Get current settings
            const difficulty = this.settingsManager?.getSetting('difficulty') || 'medium';
            const gridSize = this.settingsManager?.getSetting('gridSize') || 'medium';

            try {
                console.log('Attempting AI puzzle generation...');
                this.updateLoadingStep('generate', 'Generating theme...');
                
                const puzzle = await this.generateAIPuzzle(difficulty, gridSize);
                
                if (puzzle && puzzle.grid && puzzle.clues) {
                    console.log('AI puzzle generated successfully');
                    this.updateLoadingStep('build', 'Building grid...');
                    
                    this.currentTheme = puzzle.theme || 'AI-Generated Puzzle';
                    this.engine.loadPuzzle(puzzle);
                    this.ui.renderGrid();
                    this.ui.renderClues();
                    
                    // Auto-select first word
                    this.autoSelectFirstWord();
                    
                    this.updateThemeDisplay();
                    const message = window.i18n ? window.i18n.t('newPuzzleGenerated') : 'New puzzle generated successfully!';
            this.showNotification(message, 'success');
                    return;
                }
            } catch (aiError) {
                console.log('AI puzzle generation failed:', aiError);
                const message = window.i18n ? window.i18n.format('aiGenerationFailed', { error: aiError.message }) : `AI puzzle generation failed: ${aiError.message}. Using fallback puzzle.`;
            this.showNotification(message, 'warning');
                
                // Generate fallback puzzle
                this.generateFallbackPuzzle();
            }
        } catch (error) {
            console.error('Failed to generate puzzle:', error);
            const message = window.i18n ? window.i18n.t('failedToGenerate') : 'Failed to generate puzzle. Please try again.';
            this.showNotification(message, 'error');
        } finally {
            this.hideLoadingScreen();
        }
    }

    generateFallbackPuzzle() {
        // Well-structured fallback puzzle demonstrating proper word crossing
        const isPortuguese = window.i18n && window.i18n.getCurrentLanguage() === 'pt';
        
        let fallbackPuzzle;
        
        if (isPortuguese) {
            fallbackPuzzle = {
                theme: "Demonstração de Aprendizado",
                grid: [
                    [null, null, null, null, null, null, null, null, null, null],
                    [null, null, 'G', 'A', 'T', 'O', null, null, null, null],
                    [null, null, null, null, null, 'S', null, null, null, null],
                    [null, null, null, null, null, 'O', null, null, null, null],
                    [null, null, null, null, null, 'L', null, null, null, null],
                    [null, null, null, null, null, null, null, null, null, null],
                    [null, null, null, null, null, null, null, null, null, null],
                    [null, null, null, null, null, null, null, null, null, null],
                    [null, null, null, null, null, null, null, null, null, null],
                    [null, null, null, null, null, null, null, null, null, null]
                ],
                clues: {
                    across: [
                        { 
                            number: 1, 
                            clue: "Animal doméstico felino", 
                            answer: "GATO", 
                            startRow: 1, 
                            startCol: 2 
                        }
                    ],
                    down: [
                        { 
                            number: 2, 
                            clue: "Estrela que nos dá luz e calor", 
                            answer: "SOL", 
                            startRow: 2, 
                            startCol: 5 
                        }
                    ]
                }
            };
        } else {
            fallbackPuzzle = {
                theme: "Learning Demo",
                grid: [
                    [null, null, null, null, null, null, null, null, null, null],
                    [null, null, "P", "E", "N", "T", "A", "G", "O", "N"],
                    [null, null, "E", null, null, null, null, null, null, null],
                    [null, null, "N", null, null, null, null, null, null, null],
                    [null, null, null, null, null, null, null, null, null, null],
                    [null, "H", "O", "R", "I", "Z", "O", "N", "T", "A"],
                    [null, null, null, null, null, null, null, null, null, null],
                    [null, null, null, null, null, null, null, null, null, null],
                    [null, null, null, null, null, null, null, null, null, null],
                    [null, null, null, null, null, null, null, null, null, null]
                ],
                clues: {
                    across: [
                        { 
                            number: 1, 
                            clue: "A polygon with five sides", 
                            answer: "PENTAGON", 
                            startRow: 1, 
                            startCol: 2 
                        },
                        { 
                            number: 4, 
                            clue: "The opposite of vertical", 
                            answer: "HORIZONTAL", 
                            startRow: 5, 
                            startCol: 1 
                        }
                    ],
                    down: [
                        { 
                            number: 2, 
                            clue: "A tool used for writing or drawing", 
                            answer: "PEN", 
                            startRow: 1, 
                            startCol: 2 
                        }
                    ]
                }
            };
        }

        this.currentTheme = fallbackPuzzle.theme;
        this.engine.loadPuzzle(fallbackPuzzle);
        this.ui.renderGrid();
        this.ui.renderClues();
        this.autoSelectFirstWord();
        this.updateThemeDisplay();
    }

    validatePuzzleData(puzzleData) {
        const errors = [];
        
        // Check basic structure
        if (!puzzleData || typeof puzzleData !== 'object') {
            errors.push('Puzzle data is not a valid object');
            return { valid: false, errors };
        }
        
        if (!Array.isArray(puzzleData.grid)) {
            errors.push('Grid is missing or not an array');
        } else if (puzzleData.grid.length === 0) {
            errors.push('Grid is empty');
        }
        
        if (!puzzleData.clues || typeof puzzleData.clues !== 'object') {
            errors.push('Clues object is missing');
        } else {
            if (!Array.isArray(puzzleData.clues.across)) {
                errors.push('Across clues are missing or not an array');
            }
            if (!Array.isArray(puzzleData.clues.down)) {
                errors.push('Down clues are missing or not an array');
            }
        }
        
        // Basic grid validation - now more lenient after normalization
        if (Array.isArray(puzzleData.grid) && puzzleData.grid.length > 0) {
            const expectedCols = puzzleData.grid[0] ? puzzleData.grid[0].length : 0;
            
            // Check if grid is reasonable size (between 5x5 and 25x25)
            if (puzzleData.grid.length < 5 || puzzleData.grid.length > 25) {
                errors.push(`Grid height ${puzzleData.grid.length} is not reasonable (should be 5-25)`);
            }
            
            if (expectedCols < 5 || expectedCols > 25) {
                errors.push(`Grid width ${expectedCols} is not reasonable (should be 5-25)`);
            }
            
            // Check row consistency (should be fixed by normalization)
            for (let i = 0; i < puzzleData.grid.length; i++) {
                if (!Array.isArray(puzzleData.grid[i])) {
                    errors.push(`Grid row ${i} is not an array`);
                } else if (puzzleData.grid[i].length !== expectedCols) {
                    errors.push(`Grid row ${i} has length ${puzzleData.grid[i].length}, expected ${expectedCols}`);
                }
            }
        }
        
        // Check if we have at least some clues
        if (puzzleData.clues) {
            const acrossCount = puzzleData.clues.across ? puzzleData.clues.across.length : 0;
            const downCount = puzzleData.clues.down ? puzzleData.clues.down.length : 0;
            
            if (acrossCount === 0 && downCount === 0) {
                errors.push('No clues provided');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    getGridSizeValue(gridSize) {
        const sizeMap = {
            'small': 11,
            'medium': 15,
            'large': 19
        };
        return sizeMap[gridSize] || 15; // Default to medium if unknown
    }

    async generateAIPuzzle(difficulty, gridSize, maxRetries = 3) {
        const isPortuguese = window.i18n && window.i18n.getCurrentLanguage() === 'pt';
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Generating ${difficulty} difficulty puzzle with ${gridSize} grid (attempt ${attempt}/${maxRetries})...`);
                
                // Build comprehensive prompt
                const prompt = this.buildComprehensivePrompt(difficulty, gridSize, isPortuguese);
                
                this.showThinking(true);
                this.updateLoadingStep('generate', `Generating puzzle (attempt ${attempt})...`);
                
                const response = await this.llmClient.generatePuzzle(prompt);
                
                this.showThinking(false);
                
                if (!response) {
                    throw new Error('No response received from AI service');
                }
                
                // Parse and validate the AI response
                const puzzleData = await this.parseAIResponse(response);
                const validation = this.validatePuzzleData(puzzleData);
                
                if (puzzleData && validation.valid) {
                    console.log('AI puzzle generated successfully');
                    return puzzleData;
                } else {
                    const errorMsg = validation.errors ? validation.errors.join(', ') : 'Unknown validation error';
                    throw new Error(`Invalid puzzle data: ${errorMsg}`);
                }
                
            } catch (error) {
                this.showThinking(false);
                console.warn(`AI puzzle generation attempt ${attempt} failed:`, error);
                
                // Handle connection errors with intelligent reconnection
                if (error.message.includes('Not connected to AI service') || 
                    error.message.includes('Connection refused') || 
                    error.message.includes('ERR_CONNECTION_REFUSED') ||
                    error.message.includes('fetch')) {
                    
                    console.log('Connection error detected, attempting intelligent reconnection...');
                    const reconnected = await this.autoConnectToAI();
                    
                    if (reconnected) {
                        console.log('Reconnected successfully, continuing with current attempt...');
                        continue; // Retry this attempt
                    }
                }
                
                if (attempt === maxRetries) {
                    // Provide specific error messages based on the error type
                    if (error.message.includes('Not connected to AI service')) {
                        throw new Error('No AI service connected. Please check your AI settings.');
                    } else if (error.message.includes('Invalid puzzle data')) {
                        throw new Error(`AI generated invalid puzzle data: ${error.message.split(': ')[1] || 'Unknown error'}`);
                    } else if (error.message.includes('401')) {
                        throw new Error('Invalid OpenAI API key. Please check your API key in AI settings.');
                    } else if (error.message.includes('Connection refused') || error.message.includes('ERR_CONNECTION_REFUSED')) {
                        throw new Error('LM Studio not running. Please start LM Studio or switch to OpenAI.');
                    } else if (error.message.includes('fetch')) {
                        throw new Error('Network error. Please check your internet connection and AI service settings.');
                    } else {
                        throw new Error(`AI puzzle generation failed after ${maxRetries} attempts: ${error.message}`);
                    }
                }
                
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }

    buildComprehensivePrompt(difficulty, gridSize, isPortuguese) {
        const gridSpecs = this.getGridSizeValue(gridSize);
        const difficultyInstructions = this.getDifficultyInstructions(difficulty);
        
        let basePrompt = CROSSWORD_GENERATION_PROMPT;
        
        let specificPrompt;
        if (isPortuguese) {
            specificPrompt = `
Gere uma palavra cruzada em português:
- Dificuldade: ${difficulty}
- Tamanho da grade: ${gridSpecs.rows}x${gridSpecs.cols}
- Todas as respostas devem ser em português
- Todas as pistas devem ser em português
- Use palavras comuns amplamente conhecidas
- ${difficultyInstructions}

Responda APENAS com o objeto JSON conforme especificado.`;
        } else {
            specificPrompt = `
Generate an English crossword puzzle:
- Difficulty: ${difficulty}  
- Grid size: ${gridSpecs.rows}x${gridSpecs.cols}
- All answers must be in English
- All clues must be in English
- Use commonly known words
- ${difficultyInstructions}

Respond with ONLY the JSON object as specified.`;
        }
        
        return basePrompt + specificPrompt;
    }

    getDifficultyInstructions(difficulty) {
        const instructions = {
            easy: "Use simple vocabulary, straightforward clues, 3-6 letter words mainly",
            medium: "Mix of common and moderately challenging words, some wordplay allowed",
            hard: "Complex vocabulary, sophisticated wordplay, longer words acceptable"
        };
        
        return instructions[difficulty] || instructions.medium;
    }

    async parseAIResponse(response) {
        try {
            // Parse the JSON response if it's a string
            let puzzleData;
            if (typeof response === 'string') {
                // Try to extract JSON from the response
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    puzzleData = JSON.parse(jsonMatch[0]);
                } else {
                    console.error('No JSON found in response');
                    return null;
                }
            } else {
                puzzleData = response;
            }
            
            // Validate that we have the required structure
            if (puzzleData && puzzleData.grid && puzzleData.clues) {
                // Normalize the grid to ensure all rows have the same length
                const normalizedGrid = this.normalizeGrid(puzzleData.grid);
                
                return {
                    grid: normalizedGrid,
                    clues: puzzleData.clues,
                    theme: puzzleData.theme || 'AI Generated Puzzle',
                    difficulty: puzzleData.difficulty || 'medium'
                };
            } else {
                console.error('Invalid puzzle data structure:', puzzleData);
                return null;
            }
        } catch (error) {
            console.error('Error parsing AI response:', error);
            return null;
        }
    }

    normalizeGrid(grid) {
        if (!Array.isArray(grid) || grid.length === 0) {
            return [];
        }
        
        // Find the maximum row length
        const maxLength = Math.max(...grid.map(row => Array.isArray(row) ? row.length : 0));
        
        // Normalize all rows to have the same length
        return grid.map(row => {
            if (!Array.isArray(row)) {
                return new Array(maxLength).fill('');
            }
            
            // Pad short rows with empty strings
            while (row.length < maxLength) {
                row.push('');
            }
            
            // Truncate long rows
            if (row.length > maxLength) {
                row = row.slice(0, maxLength);
            }
            
            return row;
        });
    }

    async getHint() {
        const selectedClue = this.ui.getSelectedClue();
        if (!selectedClue) {
            const message = window.i18n ? window.i18n.t('pleaseSelectWord') : 'Please select a word first';
            this.showNotification(message, 'warning');
            return;
        }

        try {
            const { number, direction } = selectedClue;
            const clue = this.engine.getClue(number, direction);
            const currentAnswer = this.engine.getCurrentAnswer(number, direction);
            
            this.showThinking(true);
            
            const hint = await this.llmClient.getHint(clue, currentAnswer);
            
            this.showThinking(false);
            
            if (hint) {
                this.engine.incrementHints();
                this.ui.showHint(hint);
                this.ui.updateProgressDisplay();
            } else {
                // Fallback to basic hint
                const basicHint = this.generateBasicHint(currentAnswer);
                this.engine.incrementHints();
                this.ui.showHint(basicHint);
                this.ui.updateProgressDisplay();
            }
            
        } catch (error) {
            this.showThinking(false);
            console.error('Error getting hint:', error);
            
            // If connection error, try intelligent reconnection
            if (error.message.includes('Not connected to AI service') || 
                error.message.includes('Connection refused') || 
                error.message.includes('ERR_CONNECTION_REFUSED') ||
                error.message.includes('fetch')) {
                
                console.log('Connection error detected, attempting intelligent reconnection for hint...');
                
                // Try intelligent reconnection
                const reconnected = await this.autoConnectToAI();
                
                if (reconnected) {
                    console.log('Reconnected successfully, retrying hint generation...');
                    
                    try {
                        const { number, direction } = selectedClue;
                        const clue = this.engine.getClue(number, direction);
                        const currentAnswer = this.engine.getCurrentAnswer(number, direction);
                        
                        this.showThinking(true);
                        const hint = await this.llmClient.getHint(clue, currentAnswer);
                        this.showThinking(false);
                        
                        if (hint) {
                            this.engine.incrementHints();
                            this.ui.showHint(hint);
                            this.ui.updateProgressDisplay();
                            return;
                        }
                    } catch (retryError) {
                        console.error('Hint retry failed:', retryError);
                        this.showThinking(false);
                    }
                }
            }
            
            // Fallback to basic hint
            const { number, direction } = selectedClue;
            const currentAnswer = this.engine.getCurrentAnswer(number, direction);
            const basicHint = this.generateBasicHint(currentAnswer);
            this.engine.incrementHints();
            this.ui.showHint(basicHint);
            this.ui.updateProgressDisplay();
        }
    }

    generateBasicHint(currentAnswer) {
        const isPortuguese = window.i18n && window.i18n.getCurrentLanguage() === 'pt';
        
        if (!currentAnswer) {
            return isPortuguese ? 
                "Tente preencher algumas letras para começar!" : 
                "Try filling in some letters to get started!";
        }
        
        const filledLetters = currentAnswer.replace(/\s/g, '').length;
        const totalLetters = currentAnswer.length;
        const percentage = Math.round((filledLetters / totalLetters) * 100);
        
        if (percentage === 0) {
            return isPortuguese ? 
                "Comece pensando na pista e tente sua primeira letra!" : 
                "Start by thinking about the clue and try your first letter!";
        } else if (percentage < 50) {
            return isPortuguese ? 
                `Você completou ${percentage}% desta palavra. Continue!` : 
                `You've completed ${percentage}% of this word. Keep going!`;
        } else {
            return isPortuguese ? 
                `Você está ${percentage}% lá! Você está indo muito bem!` : 
                `You're ${percentage}% there! You're doing great!`;
        }
    }

    getOrdinalSuffix(num) {
        const j = num % 10;
        const k = num % 100;
        if (j === 1 && k !== 11) return 'st';
        if (j === 2 && k !== 12) return 'nd';
        if (j === 3 && k !== 13) return 'rd';
        return 'th';
    }

    checkAnswers() {
        const results = this.engine.checkAllAnswers();
        this.ui.highlightResults(results);
        
        // Check if puzzle is complete
        if (this.engine.isPuzzleComplete()) {
            this.handlePuzzleComplete();
        }
    }

    handlePuzzleComplete() {
        const endTime = Date.now();
        const timeSpent = endTime - this.startTime;
        const minutes = Math.floor(timeSpent / 60000);
        const seconds = Math.floor((timeSpent % 60000) / 1000);
        
        // Update final stats
        document.getElementById('final-time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('final-hints').textContent = this.engine.getHintsUsed();
        
        // Show congratulations modal
        this.showModal('congratulations-modal');
    }

    handleProviderChange(provider) {
        this.llmClient.setProvider(provider);
        
        // Show/hide relevant settings
        const lmstudio = document.getElementById('lmstudio-settings');
        const openai = document.getElementById('openai-settings');
        
        if (provider === 'lmstudio') {
            if (lmstudio) lmstudio.style.display = 'block';
            if (openai) openai.style.display = 'none';
        } else {
            if (lmstudio) lmstudio.style.display = 'none';
            if (openai) openai.style.display = 'block';
        }
        
        // If switching to OpenAI, ensure the API key is loaded
        if (provider === 'openai') {
            const storage = new SecureStorage();
            const apiKey = storage.getApiKey('openai');
            if (apiKey) {
                this.llmClient.setOpenAIApiKey(apiKey);
            }
        }
        
        // Update connection info
        if (this.ui && this.ui.settingsManager) {
            this.ui.settingsManager.updateConnectionInfo();
        }
        
        this.updateConnectionStatus();
    }

    async testAIConnection() {
        const testBtn = document.getElementById('test-connection-btn');
        const connectionStatus = document.getElementById('connection-status');
        
        if (testBtn) {
            testBtn.disabled = true;
            testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
        }
        
        try {
            const result = await this.llmClient.testConnection();
            
            if (connectionStatus) {
                connectionStatus.className = result.success ? 
                    'connection-status connected' : 'connection-status';
                connectionStatus.innerHTML = `
                    <i class="fas fa-circle connection-dot"></i>
                    ${result.message}
                `;
            }
            
            // Update connection info
            if (this.ui && this.ui.settingsManager) {
                this.ui.settingsManager.updateConnectionInfo();
            }
        } catch (error) {
            if (connectionStatus) {
                connectionStatus.className = 'connection-status';
                connectionStatus.innerHTML = `
                    <i class="fas fa-circle connection-dot"></i>
                    Connection failed: ${error.message}
                `;
            }
        } finally {
            if (testBtn) {
                testBtn.disabled = false;
                testBtn.innerHTML = '<i class="fas fa-wifi"></i> <span data-lang="testConnection">Testar Conexão</span>';
            }
        }
    }

    updateConnectionStatus(connected = false, message = 'Not connected') {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            const dot = statusElement.querySelector('.connection-dot');
            const text = statusElement.querySelector('span');
            
            if (connected) {
                statusElement.classList.add('connected');
                if (text) text.textContent = message;
            } else {
                statusElement.classList.remove('connected');
                if (text) text.textContent = message;
            }
        }
    }

    handleKeyboardShortcuts(e) {
        // Esc key to close modals
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                this.closeModal(modal.id);
            });
        }
        
        // Ctrl+N for new puzzle
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            this.generateNewPuzzle();
        }
        
        // Ctrl+H for hint
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            this.getHint();
        }
        
        // Tab to switch between across/down clues
        if (e.key === 'Tab' && e.target.closest('.clues-section')) {
            e.preventDefault();
            const currentTab = document.querySelector('.clues-tab.active');
            const nextDirection = currentTab?.id === 'across-tab' ? 'down' : 'across';
            this.switchClueTab(nextDirection);
        }
    }

    showThinking(isThinking) {
        const thinkingIndicator = document.getElementById('thinking-indicator');
        if (thinkingIndicator) {
            if (isThinking) {
                thinkingIndicator.classList.add('active');
            } else {
                thinkingIndicator.classList.remove('active');
            }
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        // Use the centralized notification manager
        if (window.notifications) {
            return window.notifications.show(message, type, duration);
        } else {
            // Fallback for cases where notification manager isn't loaded yet
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            
            // Update connection info if it's the AI settings modal
            if (modalId === 'ai-settings-modal' && this.ui && this.ui.settingsManager) {
                this.ui.settingsManager.updateConnectionInfo();
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    cleanupSecureStorage() {
        // Clean up any old stored data
        try {
            const secureStorage = new SecureStorage();
            secureStorage.clear();
        } catch (error) {
            console.warn('Could not clean up secure storage:', error);
        }
    }

    handleGlobalError(error) {
        console.error('Global error handler:', error);
        const message = window.i18n ? window.i18n.t('unexpectedError') : 'An unexpected error occurred. Please try again.';
        this.showNotification(message, 'error');
    }

    handleSettingChange(key, value) {
        if (key === 'aiProvider') {
            this.llmClient.setProvider(value);
        } else if (key === 'lmstudioEndpoint') {
            this.llmClient.setEndpoint(value);
        } else if (key === 'openaiApiKey') {
            // Check if the API key actually changed to prevent unnecessary operations
            const currentKey = this.llmClient.openaiApiKey || '';
            if (value === currentKey) {
                return; // No change, skip processing
            }
            
            console.log('OpenAI API key changed, updating connection...');
            this.llmClient.setOpenAIApiKey(value);
            
            // If a new OpenAI API key is set, automatically test connection and set provider
            if (value && value.trim()) {
                console.log('New OpenAI API key detected, setting up connection...');
                
                // Clear any existing timeout to prevent multiple connection tests
                if (this.connectionTestTimeout) {
                    clearTimeout(this.connectionTestTimeout);
                }
                
                this.connectionTestTimeout = setTimeout(async () => {
                    try {
                        // Ensure we're using OpenAI provider
                        this.llmClient.setProvider('openai');
                        this.updateProviderUI('openai');
                        
                        const result = await this.llmClient.testConnection();
                        
                        if (result.success) {
                            this.updateConnectionStatus(true, 'Connected to OpenAI');
                            
                            const successMessage = window.i18n ? 
                                window.i18n.t('openaiConnected') : 
                                'Successfully connected to OpenAI!';
                            this.showNotification(successMessage, 'success');
                            
                            // Update connection info
                            if (this.ui && this.ui.settingsManager) {
                                this.ui.settingsManager.updateConnectionInfo();
                            }
                        } else {
                            const errorMessage = window.i18n ? 
                                window.i18n.t('connectionFailed') : 
                                'Connection failed. Please check your API key.';
                            this.showNotification(errorMessage, 'error');
                        }
                    } catch (error) {
                        console.error('Auto connection test failed:', error);
                        const errorMessage = window.i18n ? 
                            window.i18n.t('connectionError') : 
                            'Error testing connection. Please check your API key.';
                        this.showNotification(errorMessage, 'error');
                    }
                }, 800); // Shorter delay for better user experience
            } else if (value === '' || value === null) {
                // API key was cleared
                this.updateConnectionStatus(false, 'No API key set');
                this.llmClient.setProvider('lmstudio'); // Fall back to LM Studio
                this.updateProviderUI('lmstudio');
            }
        }
    }

    // Auto-connect to available AI models (prefer local)
    async autoConnectToAI() {
        try {
            // Test localStorage functionality
            console.log('Testing localStorage...');
            try {
                localStorage.setItem('test_key', 'test_value');
                const testValue = localStorage.getItem('test_key');
                console.log('localStorage test result:', testValue);
                localStorage.removeItem('test_key');
                
                if (testValue !== 'test_value') {
                    console.error('localStorage not working properly!');
                }
            } catch (error) {
                console.error('localStorage error:', error);
            }
            
            // First try LM Studio (local)
            this.llmClient.setProvider('lmstudio');
            let result = await this.llmClient.testConnection();
            
            if (result.success) {
                this.updateConnectionStatus(true, 'Connected to LM Studio');
                console.log('Auto-connected to LM Studio');
                
                // Update UI to reflect LM Studio selection
                this.updateProviderUI('lmstudio');
                
                // Update connection info
                if (this.ui && this.ui.settingsManager) {
                    this.ui.settingsManager.updateConnectionInfo();
                }
                return true;
            }

            console.log('LM Studio not available, checking OpenAI...');

            // If LM Studio fails, check for OpenAI API key
            const storage = new SecureStorage();
            const openaiKey = storage.getApiKey('openai');
            
            console.log('Checking for stored OpenAI API key...');
            console.log('Retrieved key:', openaiKey ? `${openaiKey.substring(0, 8)}...` : 'null');
            console.log('Key length:', openaiKey ? openaiKey.length : 0);
            
            if (openaiKey) {
                console.log('OpenAI API key found, switching to OpenAI...');
                this.llmClient.setProvider('openai');
                this.llmClient.setOpenAIApiKey(openaiKey);
                result = await this.llmClient.testConnection();
                
                if (result.success) {
                    this.updateConnectionStatus(true, 'Connected to OpenAI');
                    console.log('Auto-connected to OpenAI');
                    
                    // Update UI to reflect OpenAI selection
                    this.updateProviderUI('openai');
                    
                    // Show notification about automatic switch
                    const message = window.i18n ? 
                        window.i18n.t('lmStudioNotAvailable') : 
                        'LM Studio not available. Automatically connected to OpenAI.';
                    this.showNotification(message, 'info');
                    
                    // Update connection info
                    if (this.ui && this.ui.settingsManager) {
                        this.ui.settingsManager.updateConnectionInfo();
                    }
                    return true;
                } else {
                    console.log('OpenAI connection failed with existing key');
                    // Key exists but connection failed - show error
                    const message = window.i18n ? 
                        window.i18n.t('invalidOpenAIKey') : 
                        'Invalid OpenAI API key. Please check your key in AI settings.';
                    this.showNotification(message, 'error');
                }
            } else {
                console.log('No OpenAI API key found, prompting user...');
                // No OpenAI key found - prompt user to add one
                this.promptForOpenAIKey();
            }

            // No connection available
            this.updateConnectionStatus(false, 'No AI connection available');
            console.log('No AI connections available');
            return false;
            
        } catch (error) {
            console.warn('Auto-connection failed:', error);
            this.updateConnectionStatus(false, 'Connection failed');
            return false;
        }
    }

    // Update provider UI elements
    updateProviderUI(provider) {
        const providerSelect = document.getElementById('ai-provider-select');
        if (providerSelect) {
            providerSelect.value = provider;
        }
        
        // Update settings manager if available (without triggering cascading saves)
        if (this.ui && this.ui.settingsManager) {
            // Only update if different to prevent cascading events
            const currentProvider = this.ui.settingsManager.getSetting('aiProvider');
            if (currentProvider !== provider) {
                this.ui.settingsManager.setSetting('aiProvider', provider);
            }
        }
        
        // Show/hide relevant settings
        this.handleProviderChange(provider);
    }

    // Prompt user to add OpenAI API key
    promptForOpenAIKey() {
        const message = window.i18n ? 
            window.i18n.t('noAIConnection') : 
            'No AI connection available. Add an OpenAI API key in AI settings to generate custom puzzles.';
        
        this.showNotification(message, 'warning', 8000); // Show for 8 seconds
        
        // Auto-open AI settings modal after a short delay
        setTimeout(() => {
            this.showModal('ai-settings-modal');
            
            // Focus on the OpenAI API key input
            const apiKeyInput = document.getElementById('openai-key');
            if (apiKeyInput) {
                // Switch to OpenAI provider first
                const providerSelect = document.getElementById('ai-provider-select');
                if (providerSelect) {
                    providerSelect.value = 'openai';
                    this.handleProviderChange('openai');
                }
                
                // Load existing API key if any
                const storage = new SecureStorage();
                const existingKey = storage.getApiKey('openai');
                if (existingKey) {
                    apiKeyInput.value = existingKey;
                }
                
                // Focus on the API key input and select all text for easy replacement
                setTimeout(() => {
                    apiKeyInput.focus();
                    apiKeyInput.select();
                }, 100);
                
                // Add a one-time event listener to test connection when key is entered
                const testConnectionOnSave = () => {
                    setTimeout(async () => {
                        const newKey = apiKeyInput.value.trim();
                        if (newKey && newKey !== existingKey) {
                            console.log('New API key entered, testing connection...');
                            
                            // Set the new key and test connection
                            this.llmClient.setProvider('openai');
                            this.llmClient.setOpenAIApiKey(newKey);
                            
                            try {
                                const result = await this.llmClient.testConnection();
                                if (result.success) {
                                    this.updateConnectionStatus(true, 'Connected to OpenAI');
                                    this.updateProviderUI('openai');
                                    
                                    const successMessage = window.i18n ? 
                                        window.i18n.t('openaiConnected') : 
                                        'Successfully connected to OpenAI!';
                                    this.showNotification(successMessage, 'success');
                                    
                                    // Close modal after successful connection
                                    setTimeout(() => {
                                        this.closeModal('ai-settings-modal');
                                    }, 1500);
                                } else {
                                    const errorMessage = window.i18n ? 
                                        window.i18n.t('connectionFailed') : 
                                        'Connection failed. Please check your API key.';
                                    this.showNotification(errorMessage, 'error');
                                }
                            } catch (error) {
                                console.error('Connection test failed:', error);
                                const errorMessage = window.i18n ? 
                                    window.i18n.t('connectionError') : 
                                    'Error testing connection. Please check your API key.';
                                this.showNotification(errorMessage, 'error');
                            }
                        }
                    }, 500); // Small delay to ensure key is saved first
                };
                
                // Listen for blur event (when user finishes entering key)
                apiKeyInput.addEventListener('blur', testConnectionOnSave, { once: true });
            }
        }, 2000); // Wait 2 seconds before opening modal
    }

    // Show loading screen with animation
    showLoadingScreen() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('active');
        }
    }

    // Hide loading screen
    hideLoadingScreen() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
        }
    }

    // Update loading step
    updateLoadingStep(stepId, message) {
        // Remove active class from all steps
        document.querySelectorAll('.loading-steps .step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Add active class to current step
        const currentStep = document.querySelector(`[data-step="${stepId}"]`);
        if (currentStep) {
            currentStep.classList.add('active');
        }
        
        // Update loading message
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
    }

    // Auto-select the first word for better UX
    autoSelectFirstWord() {
        try {
            // Find the first across clue
            const puzzle = this.engine.currentPuzzle;
            if (puzzle && puzzle.clues && puzzle.clues.across && puzzle.clues.across.length > 0) {
                const firstClue = puzzle.clues.across[0];
                if (firstClue && this.ui) {
                    // Select the first word
                    this.ui.selectWord(firstClue.number, 'across');
                }
            }
        } catch (error) {
            console.warn('Could not auto-select first word:', error);
        }
    }

    // Update theme display in header
    updateThemeDisplay() {
        const themeTitle = document.getElementById('theme-title');
        const currentClue = document.getElementById('current-clue');
        
        if (themeTitle) {
            themeTitle.textContent = this.currentTheme || 'Crossword Puzzle';
        }
        
        if (this.ui && this.ui.currentWord) {
            const clueText = this.engine.getClue(this.ui.currentWord.number, this.ui.currentWord.direction);
            if (currentClue) {
                // Use translated direction
                const translatedDirection = window.i18n ? window.i18n.t(this.ui.currentWord.direction) : this.ui.currentWord.direction.toUpperCase();
                currentClue.textContent = `${this.ui.currentWord.number} ${translatedDirection.toUpperCase()}: ${clueText}`;
            }
        } else if (currentClue) {
            const message = window.i18n ? window.i18n.t('clickClueToStart') : 'Clique em uma pista para começar a resolver';
            currentClue.textContent = message;
        }
    }

    // Switch between clue tabs
    switchClueTab(direction) {
        const acrossTab = document.getElementById('across-tab');
        const downTab = document.getElementById('down-tab');
        const acrossClues = document.getElementById('across-clues');
        const downClues = document.getElementById('down-clues');

        if (direction === 'across') {
            acrossTab?.classList.add('active');
            downTab?.classList.remove('active');
            acrossClues?.classList.add('active');
            downClues?.classList.remove('active');
            
            acrossTab?.setAttribute('aria-selected', 'true');
            downTab?.setAttribute('aria-selected', 'false');
            acrossClues?.removeAttribute('hidden');
            downClues?.setAttribute('hidden', '');
        } else {
            downTab?.classList.add('active');
            acrossTab?.classList.remove('active');
            downClues?.classList.add('active');
            acrossClues?.classList.remove('active');
            
            downTab?.setAttribute('aria-selected', 'true');
            acrossTab?.setAttribute('aria-selected', 'false');
            downClues?.removeAttribute('hidden');
            acrossClues?.setAttribute('hidden', '');
        }
    }

    // Update progress circle
    updateProgressCircle() {
        const progress = this.engine.getProgress();
        const progressRing = document.getElementById('progress-ring');
        const progressText = document.getElementById('progress-text');
        const wordsCompleted = document.getElementById('words-completed');
        const wordsTotal = document.getElementById('words-total');

        if (progressRing && progressText) {
            const circumference = 2 * Math.PI * 25; // radius = 25
            const offset = circumference - (progress.percentage / 100) * circumference;
            
            progressRing.style.strokeDashoffset = offset;
            progressText.textContent = `${progress.percentage}%`;
        }

        if (wordsCompleted && wordsTotal) {
            wordsCompleted.textContent = progress.completed;
            wordsTotal.textContent = progress.total;
        }
    }

    // Show error message to user
    showErrorMessage(message) {
        const statusText = document.getElementById('status-text');
        if (statusText) {
            statusText.textContent = message;
            statusText.style.color = 'var(--danger-color)';
            
            // Reset color after a few seconds
            setTimeout(() => {
                if (statusText) {
                    statusText.style.color = '';
                }
            }, 5000);
        }
        
        console.error('User Error:', message);
    }

    initializeLanguageSystem() {
        // Initialize language manager (already created by language-manager.js)
        if (window.i18n) {
            // Set default language to Portuguese
            const savedLanguage = localStorage.getItem('crossword-language') || 'pt';
            window.i18n.setLanguage(savedLanguage);
            console.log('Language system initialized with language:', savedLanguage);
        }
    }

    updateLanguage(language) {
        if (window.i18n) {
            window.i18n.setLanguage(language);
            console.log('Language changed to:', language);
            
            // Update any dynamic content that needs refresh
            this.updateThemeDisplay();
            
            // Show notification in the new language
            const message = language === 'pt' ? 'Idioma alterado para Português' : 'Language changed to English';
            this.showNotification(message, 'info');
        }
    }

    // Debug function to inspect localStorage (call from browser console)
    debugStorage() {
        console.log('=== Storage Debug Info ===');
        console.log('localStorage keys:');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            console.log(`${key}:`, value);
        }
        
        console.log('\n=== SecureStorage Test ===');
        const storage = new SecureStorage();
        const openaiKey = storage.getApiKey('openai');
        console.log('OpenAI key from SecureStorage:', openaiKey ? `${openaiKey.substring(0, 8)}...` : 'null');
        
        // Test encryption/decryption
        const testValue = 'test-api-key-12345';
        storage.setApiKey('test', testValue);
        const retrieved = storage.getApiKey('test');
        console.log('Encryption test - original:', testValue);
        console.log('Encryption test - retrieved:', retrieved);
        console.log('Encryption test - match:', testValue === retrieved);
        storage.clearApiKey('test');
    }
}

// Initialize the app
const app = new CrosswordApp();

// Make app globally accessible for UI components
window.app = app;

// Make debug function available globally
window.debugStorage = () => app.debugStorage();
console.log('Debug function available: window.debugStorage()'); 