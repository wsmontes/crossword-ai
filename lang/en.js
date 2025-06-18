const en = {
    // Main UI
    title: "Crossword Puzzle AI",
    subtitle: "You",
    assistant: "AI Assistant",
    
    // Buttons
    newPuzzle: "New Puzzle",
    getHint: "Get Hint",
    checkAnswers: "Check Answers",
    playAgain: "Play Again",
    
    // Grid and clues
    clickClueToStart: "Click on a clue to start solving",
    across: "Across",
    down: "Down",
    
    // Progress
    progress: "Progress",
    wordsCompleted: "Words Completed",
    totalWords: "Total Words",
    hintsUsed: "Hints Used",
    
    // Settings
    settings: "Settings",
    difficulty: "Difficulty:",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    gridSize: "Grid Size:",
    small: "Small",
    large: "Large",
    autoCheck: "Auto-check answers",
    highlightMistakes: "Highlight mistakes",
    
    // AI Settings
    aiSettings: "AI Settings",
    aiProvider: "AI Provider:",
    lmStudioEndpoint: "LM Studio Endpoint:",
    openaiApiKey: "OpenAI API Key",
    testConnection: "Test Connection",
    connected: "Connected to LM Studio",
    notConnected: "Not connected",
    
    // Advanced Settings
    advancedSettings: "Advanced Settings",
    
    // Language
    language: "Language:",
    portuguese: "Portuguese",
    english: "English",
    
    // Modal actions
    save: "Save",
    cancel: "Cancel",
    saving: "Saving...",
    saved: "Saved",
    settingsSaved: "Settings saved successfully!",
    
    // Messages
    generating: "Generating crossword puzzle...",
    aiGenerating: "AI is creating your puzzle...",
    readyToPlay: "Ready to play!",
    pleasewait: "Please wait while we create your custom crossword puzzle.",
    puzzleComplete: "Congratulations! You completed the crossword puzzle!",
    connectionError: "Connection error with AI server",
    generationError: "Error generating crossword puzzle",
    
    // Hints
    hintFor: "Hint for",
    noHintAvailable: "No hint available for this word",
    
    // Validation
    correct: "Correct!",
    incorrect: "Incorrect",
    
    // UI Messages
    pleaseComplete: "Please complete the word before submitting",
    incorrectTryAgain: "Incorrect. Try again!",
    
    // Notification Messages
    failedToInitialize: "Failed to initialize application. Please refresh the page.",
    newPuzzleGenerated: "New puzzle generated successfully!",
    aiGenerationFailed: "AI puzzle generation failed: {error}. Using fallback puzzle.",
    failedToGenerate: "Failed to generate puzzle. Please try again.",
    pleaseSelectWord: "Please select a word first",
    unexpectedError: "An unexpected error occurred. Please try again.",
    
    // AI Connection Messages
    lmStudioNotAvailable: "LM Studio not available. Automatically connected to OpenAI.",
    invalidOpenAIKey: "Invalid OpenAI API key. Please check your key in AI settings.",
    noAIConnection: "No AI connection available. Add an OpenAI API key in AI settings to generate custom puzzles.",
    openaiConnected: "Successfully connected to OpenAI!",
    connectionFailed: "Connection failed. Please check your API key.",
    connectionError: "Error testing connection. Please check your API key.",
    
    // Input placeholders
    typeAnswer: "Type your answer...",
    enterApiKey: "Enter your API key",
    
    // Loading screen
    connectingAI: "Connecting to AI",
    generatingTheme: "Generating Theme",
    buildingGrid: "Building Grid",
    
    // Completion modal
    time: "Time",
    
    // Aria Labels
    settingsAriaLabel: "Settings",
    aiSettingsAriaLabel: "AI Settings",
    toggleThemeAriaLabel: "Toggle dark mode",
    gameStatusAriaLabel: "Game Status",
    gameProgressAriaLabel: "Game progress",
    getHintAriaLabel: "Get hint for current word",
    checkAnswersAriaLabel: "Check current answers",
    generatePuzzleAriaLabel: "Generate new puzzle",
    crosswordPuzzleAriaLabel: "Crossword puzzle",
    crosswordGridAriaLabel: "Crossword puzzle grid",
    currentWordInputAriaLabel: "Current word input",
    enterAnswerAriaLabel: "Enter your answer",
    submitWordAriaLabel: "Submit word",
    crosswordCluesAriaLabel: "Crossword clues",
    quickNewPuzzleAriaLabel: "Quick new puzzle",
    closeAriaLabel: "Close",
    
    // Themes (for AI generation)
    themes: {
        garden: "Gardening",
        cooking: "Cooking", 
        sports: "Sports",
        science: "Science",
        history: "History",
        nature: "Nature",
        technology: "Technology",
        arts: "Arts",
        travel: "Travel",
        animals: "Animals"
    },
    
    // Error messages
    errors: {
        failedToLoad: "Failed to load crossword puzzle",
        invalidPuzzle: "Invalid puzzle data",
        connectionTimeout: "Connection timeout",
        aiNotAvailable: "AI service not available",
        parseError: "Error parsing AI response"
    },
    
    // Prompts for AI (in English)
    aiPrompts: {
        themeGeneration: "Generate a theme for a crossword puzzle with related words. The theme should be interesting and have at least 30 related words. Respond in JSON format: {\"theme\": \"theme name\", \"description\": \"brief description\", \"words\": [\"WORD1 - explanation\", \"WORD2 - explanation\", ...]}",
        
        wordSelection: "Select the best words from the provided list to create a crossword puzzle. Choose words that intersect well and have interesting clues. Respond in JSON format: {\"selectedWords\": [{\"word\": \"WORD\", \"clue\": \"clever clue\", \"length\": number, \"reason\": \"why this word works well\"}], \"explanation\": \"brief explanation\"}",
        
        clueGeneration: "Generate creative and clever clues for the provided words. The clues should be challenging but fair. Respond in JSON format.",
        
        hintGeneration: "Generate a helpful hint for the word '{word}' with clue '{clue}'. The hint should help without giving away the complete answer."
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = en;
} else {
    window.en = en;
} 