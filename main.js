// Main application initialization
class CrosswordApp {
    constructor() {
        this.engine = null;
        this.llmClient = null;
        this.ui = null;
        this.startTime = null;
        this.hintsUsed = 0;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }

    initializeApp() {
        try {
            // Clean up old stored API keys on startup
            this.cleanupSecureStorage();

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

            // Generate initial puzzle
            this.generateNewPuzzle();

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
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    setupEventListeners() {
        // New puzzle button
        document.getElementById('new-puzzle-btn').addEventListener('click', () => {
            this.generateNewPuzzle();
        });

        // Hint button
        document.getElementById('hint-btn').addEventListener('click', () => {
            this.getHint();
        });

        // Check answers button
        document.getElementById('check-btn').addEventListener('click', () => {
            this.checkAnswers();
        });

        // Modal buttons
        document.getElementById('new-puzzle-modal-btn').addEventListener('click', () => {
            this.closeModal();
            this.generateNewPuzzle();
        });

        document.getElementById('close-modal-btn').addEventListener('click', () => {
            this.closeModal();
        });

        // Settings
        document.getElementById('difficulty-select').addEventListener('change', (e) => {
            this.engine.setDifficulty(e.target.value);
        });

        document.getElementById('grid-size-select').addEventListener('change', (e) => {
            this.engine.setGridSize(e.target.value);
        });

        // AI settings
        document.getElementById('ai-provider-select').addEventListener('change', (e) => {
            this.handleProviderChange(e.target.value);
        });

        document.getElementById('test-connection-btn').addEventListener('click', () => {
            this.testAIConnection();
        });

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
    }

    async generateNewPuzzle() {
        try {
            this.showThinking(true);
            this.startTime = Date.now();
            this.hintsUsed = 0;
            
            document.getElementById('status-text').textContent = 'Generating new puzzle...';
            
            // Get settings
            const difficulty = document.getElementById('difficulty-select').value;
            const gridSize = document.getElementById('grid-size-select').value;
            
            let puzzleData;
            
            // Try AI generation if connected
            if (this.llmClient.isConnected) {
                try {
                    document.getElementById('status-text').textContent = 'AI is creating your puzzle...';
                    puzzleData = await this.generateAIPuzzle(difficulty, gridSize);
                    
                    // Validate the generated puzzle
                    const validation = this.validatePuzzleData(puzzleData);
                    if (!validation.valid) {
                        console.warn('AI generated invalid puzzle:', validation.errors);
                        throw new Error('AI generated invalid puzzle structure');
                    }
                } catch (aiError) {
                    console.warn('AI puzzle generation failed:', aiError);
                    document.getElementById('status-text').textContent = 'AI generation failed, using built-in puzzle...';
                    puzzleData = this.engine.generatePredefinedPuzzle(difficulty, gridSize);
                }
            } else {
                puzzleData = this.engine.generatePredefinedPuzzle(difficulty, gridSize);
            }
            
            // Load puzzle into engine
            this.engine.loadPuzzle(puzzleData);
            
            // Update UI
            this.ui.renderGrid();
            this.ui.renderClues();
            this.ui.updateProgress();
            
            document.getElementById('status-text').textContent = 'Click on a clue to start solving';
            this.showThinking(false);
            
        } catch (error) {
            console.error('Error generating puzzle:', error);
            this.showError('Failed to generate puzzle. Using default puzzle.');
            this.showThinking(false);
            
            // Fallback to default puzzle
            try {
                const puzzleData = this.engine.getDefaultPuzzle();
                this.engine.loadPuzzle(puzzleData);
                this.ui.renderGrid();
                this.ui.renderClues();
                this.ui.updateProgress();
            } catch (fallbackError) {
                console.error('Even fallback puzzle failed:', fallbackError);
                this.showError('Critical error: Unable to load any puzzle. Please refresh the page.');
            }
        }
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
        
        // Basic grid validation
        if (Array.isArray(puzzleData.grid) && puzzleData.grid.length > 0) {
            const expectedCols = puzzleData.grid[0].length;
            for (let i = 0; i < puzzleData.grid.length; i++) {
                if (!Array.isArray(puzzleData.grid[i]) || puzzleData.grid[i].length !== expectedCols) {
                    errors.push(`Grid row ${i} has invalid structure`);
                }
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

    async generateAIPuzzle(difficulty, gridSize) {
        try {
            console.log(`Generating ${difficulty} difficulty puzzle with ${gridSize} grid...`);
            
            // Convert grid size string to number
            const numericGridSize = this.getGridSizeValue(gridSize);
            
            // Step 1: Generate theme and words
            const themePrompt = window.i18n ? window.i18n.getAIPrompt('themeGeneration') : 
                `Você é um construtor de palavras cruzadas. Vamos criar uma palavra cruzada temática.
                
                Primeiro, sugira um tema interessante e forneça 50 palavras relacionadas a este tema.
                As palavras devem ser:
                - Entre 3 e 12 letras
                - Comuns o suficiente para um quebra-cabeça de dificuldade ${difficulty}
                - Relacionadas ao tema de maneiras interessantes
                - Incluir uma mistura de comprimentos para boa construção de grade
                - Incluir algumas palavras com letras comuns (E, S, T, A, R) para melhores interseções
                
                Formate sua resposta como um objeto JSON:
                {
                  "theme": "nome do tema",
                  "description": "breve descrição do tema",
                  "words": [
                    "PALAVRA1 - breve explicação",
                    "PALAVRA2 - breve explicação",
                    ...
                  ]
                }`;
            
            const themeResponse = await this.llmClient.generatePuzzle(themePrompt);
            console.log('Theme response received:', themeResponse);
            
            const { theme, description, words } = await this.parseThemeResponse(themeResponse);
            if (!theme || !description || !words.length) {
                throw new Error('Failed to generate valid theme and words');
            }
            
            // Step 2: Analyze words for intersections
            const wordAnalysis = this.analyzeWords(words);
            if (!wordAnalysis.validWords.length) {
                throw new Error('No valid words found for puzzle construction');
            }
            
            // Step 3: Select words and generate clues
            const wordList = wordAnalysis.validWords.map(w => `${w.word} - ${w.description}`).join('\n');
            const availableWordsList = wordAnalysis.validWords.map(w => w.word).join(', ');
            const wordSelectionPrompt = window.i18n ? window.i18n.getAIPrompt('wordSelection') : 
                `Dessas ${wordAnalysis.validWords.length} palavras do tema "${theme}", selecione EXATAMENTE 20-25 palavras que funcionariam bem em uma palavra cruzada de dificuldade ${difficulty}.

PALAVRAS DISPONÍVEIS PARA SELEÇÃO:
${wordList}

LISTA DE PALAVRAS VÁLIDAS (USE APENAS ESTAS):
${availableWordsList}

REGRAS OBRIGATÓRIAS:
1. Use APENAS as palavras da lista acima - não invente palavras novas
2. Selecione entre 20-25 palavras
3. Inclua uma mistura de comprimentos (3-12 letras)
4. Prefira palavras com letras comuns (A, E, I, O, S, T, R, N)
5. Mantenha relevância com o tema "${theme}"

Para cada palavra selecionada, forneça:
1. Uma pista inteligente em português, apropriada para dificuldade ${difficulty}
2. O comprimento exato da palavra
3. Uma breve explicação de por que esta palavra funciona bem

CRÍTICO: Use apenas palavras da lista fornecida. Qualquer palavra não listada será rejeitada.

Formate sua resposta como um objeto JSON válido:
{
  "selectedWords": [
    {
      "word": "PALAVRA_DA_LISTA",
      "clue": "pista inteligente em português",
      "length": número_exato,
      "reason": "por que esta palavra funciona bem"
    }
  ],
  "explanation": "Breve explicação da estratégia de seleção de palavras"
}`;
            
            const selectionResponse = await this.llmClient.generatePuzzle(wordSelectionPrompt);
            console.log('Word selection response received:', selectionResponse);
            
            const selectedWords = await this.parseWordSelection(selectionResponse, wordAnalysis.validWords);
            if (!selectedWords.length) {
                throw new Error('Failed to generate valid word selections');
            }
            
            console.log('Selected words sample:', selectedWords.slice(0, 3));
            
            // Step 4: Generate grid layout using random placement approach
            const gridLayout = this.generateGridLayout(selectedWords, numericGridSize);
            if (!gridLayout) {
                throw new Error('Failed to generate valid grid layout');
            }
            
            // Step 6: Generate the final puzzle
            const puzzle = {
                theme: theme,
                description: description,
                difficulty: difficulty,
                grid: gridLayout.grid,
                clues: {
                    across: gridLayout.acrossClues,
                    down: gridLayout.downClues
                }
            };
            
            // Step 7: Validate the puzzle
            if (!this.validatePuzzleWithAI(puzzle)) {
                throw new Error('Generated puzzle failed validation');
            }
            
            return puzzle;
            } catch (error) {
            console.error('Error generating AI puzzle:', error);
            throw error;
        }
    }

    analyzeWords(words) {
        const validWords = [];
        const wordMap = new Map();
        
        // Process and validate words
        for (const word of words) {
            const [wordPart, ...descParts] = word.split(' - ');
            const cleanWord = wordPart.trim().toUpperCase();
            
            // Skip invalid words
            if (cleanWord.length < 3 || cleanWord.length > 12) continue;
            if (!/^[A-Z]+$/.test(cleanWord)) continue;
            
            const description = descParts.join(' - ').trim();
            const wordObj = {
                word: cleanWord,
                description,
                length: cleanWord.length,
                letters: new Set(cleanWord.split('')),
                intersectionPotential: 0
            };
            
            validWords.push(wordObj);
            
            // Build letter frequency map
            for (const letter of cleanWord) {
                if (!wordMap.has(letter)) {
                    wordMap.set(letter, new Set());
                }
                wordMap.get(letter).add(wordObj);
            }
        }
        
        // Calculate intersection potential for each word
        for (const word of validWords) {
            for (const letter of word.letters) {
                const wordsWithLetter = wordMap.get(letter);
                if (wordsWithLetter) {
                    word.intersectionPotential += wordsWithLetter.size - 1;
                }
            }
        }
        
        // Sort words by intersection potential
        validWords.sort((a, b) => b.intersectionPotential - a.intersectionPotential);
        
        return {
            validWords,
            wordMap,
            totalWords: validWords.length
        };
    }

    findAllLetterMatches(words) {
        const matches = [];
        
        // Find all letter matches between all words
        for (let i = 0; i < words.length; i++) {
            for (let j = i + 1; j < words.length; j++) {
                const word1 = words[i];
                const word2 = words[j];
                
                // Check each letter in word1 against each letter in word2
                for (let pos1 = 0; pos1 < word1.word.length; pos1++) {
                    for (let pos2 = 0; pos2 < word2.word.length; pos2++) {
                        if (word1.word[pos1] === word2.word[pos2]) {
                            matches.push({
                                word1,
                                word2,
                                pos1,
                                pos2,
                                letter: word1.word[pos1],
                                linkPotential: this.calculateLinkPotential(word1, word2, words)
                            });
                        }
                    }
                }
            }
        }
        
        // Sort by link potential (words that can connect to more other words)
        return matches.sort((a, b) => b.linkPotential - a.linkPotential);
    }
    
    calculateLinkPotential(word1, word2, allWords) {
        // Count how many other words each of these words can potentially link to
        let potential = 0;
        
        for (const otherWord of allWords) {
            if (otherWord === word1 || otherWord === word2) continue;
            
            // Check if word1 can link to otherWord
            for (let i = 0; i < word1.word.length; i++) {
                for (let j = 0; j < otherWord.word.length; j++) {
                    if (word1.word[i] === otherWord.word[j]) {
                        potential++;
                        break;
                    }
                }
            }
            
            // Check if word2 can link to otherWord
            for (let i = 0; i < word2.word.length; i++) {
                for (let j = 0; j < otherWord.word.length; j++) {
                    if (word2.word[i] === otherWord.word[j]) {
                        potential++;
                        break;
                    }
                }
            }
        }
        
        return potential;
    }

    calculateIntersectionScore(word1, word2, pos1, pos2) {
        let score = 0;
        
        // Prefer intersections near the middle of words
        const mid1 = word1.length / 2;
        const mid2 = word2.length / 2;
        score += 10 - Math.abs(pos1 - mid1);
        score += 10 - Math.abs(pos2 - mid2);
        
        // Prefer words of different lengths
        score += Math.abs(word1.length - word2.length) * 2;
        
        // Prefer words with more common letters
        const commonLetters = new Set(word1.word.split('').filter(l => word2.word.includes(l)));
        score += commonLetters.size * 3;
        
        // Prefer common letters for intersections
        const intersectionLetter = word1.word[pos1];
        const commonIntersectionLetters = new Set(['E', 'S', 'T', 'A', 'R', 'N', 'I', 'O', 'L']);
        if (commonIntersectionLetters.has(intersectionLetter)) {
            score += 5;
        }
        
        // Penalize very short words
        if (word1.length < 4 || word2.length < 4) {
            score -= 3;
        }
        
        // Penalize very long words
        if (word1.length > 10 || word2.length > 10) {
            score -= 2;
        }
        
        // Penalize words that are too similar in length
        if (Math.abs(word1.length - word2.length) < 2) {
            score -= 2;
        }
        
        return Math.max(0, score);  // Ensure non-negative score
    }

    generateGridLayout(words, size) {
        // Start with an empty grid
        const grid = Array(size).fill(null).map(() => Array(size).fill(null));
        const availableWords = [...words]; // Copy of words we can still place
        const placedClues = []; // Track all placed words with their clue info
        
        console.log(`Starting word placement on ${size}x${size} grid with ${words.length} words`);
        
        // Place the first word in the center
        const firstWord = availableWords.shift(); // Remove from available
        const centerRow = Math.floor((size - firstWord.word.length) / 2);
        const centerCol = Math.floor((size - firstWord.word.length) / 2);
        
        console.log(`Placing first word "${firstWord.word}" at (${centerRow}, ${centerCol}) horizontally`);
        
        // Place first word horizontally in center
        for (let i = 0; i < firstWord.word.length; i++) {
            grid[centerRow][centerCol + i] = firstWord.word[i];
        }
        
        placedClues.push({
            word: firstWord,
            startRow: centerRow,
            startCol: centerCol,
            direction: 'across'
        });
        
        console.log(`First word placed successfully. ${availableWords.length} words remaining`);
        
        // Get all possible letter matches between all words
        const allMatches = this.findAllLetterMatches([...placedClues.map(p => p.word), ...availableWords]);
        console.log(`Found ${allMatches.length} potential letter matches`);
        
        // Try to place words using random selection with retries
        let attempts = 0;
        const maxAttempts = 200;
        
        while (availableWords.length > 0 && attempts < maxAttempts) {
            attempts++;
            
            // Find matches involving at least one placed word
            const validMatches = allMatches.filter(match => {
                const word1Placed = placedClues.some(p => p.word.word === match.word1.word);
                const word2Placed = placedClues.some(p => p.word.word === match.word2.word);
                const word1Available = availableWords.some(w => w.word === match.word1.word);
                const word2Available = availableWords.some(w => w.word === match.word2.word);
                
                // We want exactly one word placed and one word available
                return (word1Placed && word2Available) || (word2Placed && word1Available);
            });
            
            if (validMatches.length === 0) {
                console.log('No valid matches found, stopping placement');
                break;
            }
            
            // Randomly select a match (with preference for high link potential)
            const selectedMatch = this.selectRandomMatch(validMatches);
            
            // Determine which word to place
            const word1Placed = placedClues.some(p => p.word.word === selectedMatch.word1.word);
            const wordToPlace = word1Placed ? selectedMatch.word2 : selectedMatch.word1;
            const anchorWord = word1Placed ? selectedMatch.word1 : selectedMatch.word2;
            const intersectionPos = word1Placed ? selectedMatch.pos2 : selectedMatch.pos1;
            const anchorPos = word1Placed ? selectedMatch.pos1 : selectedMatch.pos2;
            
            console.log(`Attempt ${attempts}: Trying to place "${wordToPlace.word}" crossing "${anchorWord.word}" at letter "${selectedMatch.letter}"`);
            
            // Find anchor word placement
            const anchorPlacement = placedClues.find(p => p.word.word === anchorWord.word);
            
            // Try both directions for the new word
            const directions = ['across', 'down'];
            let placed = false;
            
            for (const direction of directions) {
                if (direction === anchorPlacement.direction) continue; // Must be perpendicular
                
                const coords = this.calculateCrossingCoordinates(
                    anchorPlacement, anchorPos, wordToPlace.word, intersectionPos, direction, size
                );
                
                if (coords && this.canPlaceWord(grid, wordToPlace.word, coords.row, coords.col, direction)) {
                    // Place the word
                    this.placeWordOnGrid(grid, wordToPlace.word, coords.row, coords.col, direction);
                    placedClues.push({
                        word: wordToPlace,
                        startRow: coords.row,
                        startCol: coords.col,
                        direction
                    });
                    
                    // Remove from available words
                    const wordIndex = availableWords.findIndex(w => w.word === wordToPlace.word);
                    availableWords.splice(wordIndex, 1);
                    
                    console.log(`✅ Successfully placed "${wordToPlace.word}" at (${coords.row}, ${coords.col}) ${direction}. ${availableWords.length} words remaining`);
                    placed = true;
                    break;
                }
            }
            
            if (!placed) {
                console.log(`❌ Failed to place "${wordToPlace.word}", trying next match`);
            }
        }
        
        // Fill remaining cells with black squares
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (grid[i][j] === null) {
                    grid[i][j] = '#';
                }
            }
        }
        
        // Calculate proper crossword numbering
        const numbering = this.calculateCrosswordNumbers(placedClues, size);
        
        // Separate clues by direction and assign proper numbers
        const acrossClues = placedClues.filter(c => c.direction === 'across')
            .map(c => ({
                number: numbering[`${c.startRow}-${c.startCol}`],
                clue: c.word.clue || `Clue for ${c.word.word}`,
                answer: c.word.word,
                startRow: c.startRow,
                startCol: c.startCol,
                direction: c.direction
            }));
            
        const downClues = placedClues.filter(c => c.direction === 'down')
            .map(c => ({
                number: numbering[`${c.startRow}-${c.startCol}`],
                clue: c.word.clue || `Clue for ${c.word.word}`,
                answer: c.word.word,
                startRow: c.startRow,
                startCol: c.startCol,
                direction: c.direction
            }));
        
        console.log(`Placement complete. Placed ${placedClues.length} out of ${words.length} words in ${attempts} attempts`);
        console.log(`Result: ${acrossClues.length} across, ${downClues.length} down`);
        
        // Debug: Show grid with black squares
        console.log('Final grid with black squares:');
        for (let i = 0; i < size; i++) {
            console.log(grid[i].map(cell => cell === '#' ? '█' : (cell || '·')).join(' '));
        }
        
        return {
            grid,
            acrossClues: acrossClues.sort((a, b) => a.number - b.number),
            downClues: downClues.sort((a, b) => a.number - b.number)
        };
    }
    
    calculateCrosswordNumbers(placedClues, gridSize) {
        // Create a map of starting positions for words
        const startPositions = new Map();
        
        // Collect all starting positions
        placedClues.forEach(clue => {
            const key = `${clue.startRow}-${clue.startCol}`;
            if (!startPositions.has(key)) {
                startPositions.set(key, {
                    row: clue.startRow,
                    col: clue.startCol,
                    hasAcross: false,
                    hasDown: false
                });
            }
            
            const pos = startPositions.get(key);
            if (clue.direction === 'across') {
                pos.hasAcross = true;
            } else {
                pos.hasDown = true;
            }
        });
        
        // Sort positions by row, then by column (traditional crossword numbering)
        const sortedPositions = Array.from(startPositions.values())
            .sort((a, b) => {
                if (a.row !== b.row) return a.row - b.row;
                return a.col - b.col;
            });
        
        // Assign numbers
        const numbering = {};
        let currentNumber = 1;
        
        sortedPositions.forEach(pos => {
            const key = `${pos.row}-${pos.col}`;
            numbering[key] = currentNumber++;
        });
        
        return numbering;
    }
    
    selectRandomMatch(matches) {
        // Weight selection by link potential, but still allow randomness
        const weights = matches.map(m => Math.max(1, m.linkPotential));
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        
        let random = Math.random() * totalWeight;
        for (let i = 0; i < matches.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return matches[i];
            }
        }
        
        return matches[matches.length - 1]; // Fallback
    }
    
    calculateCrossingCoordinates(anchorPlacement, anchorPos, newWord, newWordPos, newDirection, gridSize) {
        let row, col;
        
        if (anchorPlacement.direction === 'across' && newDirection === 'down') {
            // Anchor is horizontal, new word is vertical
            row = anchorPlacement.startRow - newWordPos;
            col = anchorPlacement.startCol + anchorPos;
        } else if (anchorPlacement.direction === 'down' && newDirection === 'across') {
            // Anchor is vertical, new word is horizontal
            row = anchorPlacement.startRow + anchorPos;
            col = anchorPlacement.startCol - newWordPos;
        } else {
            return null; // Invalid crossing
        }
        
        // Check bounds
        if (newDirection === 'across') {
            if (row < 0 || row >= gridSize || col < 0 || col + newWord.length > gridSize) {
                return null;
            }
        } else {
            if (col < 0 || col >= gridSize || row < 0 || row + newWord.length > gridSize) {
                return null;
            }
        }
        
        return { row, col };
    }
    
    placeWordOnGrid(grid, word, row, col, direction) {
        for (let i = 0; i < word.length; i++) {
            if (direction === 'across') {
                grid[row][col + i] = word[i];
            } else {
                grid[row + i][col] = word[i];
            }
        }
    }

    canPlaceWord(grid, word, startRow, startCol, direction) {
        const size = grid.length;
        
        // Check if word fits within grid boundaries
        if (direction === 'across' && startCol + word.length > size) return false;
        if (direction === 'down' && startRow + word.length > size) return false;
        if (startRow < 0 || startCol < 0) return false;
        
        // Check for valid intersections and no invalid overlaps
        let hasValidIntersection = false;
        
        for (let i = 0; i < word.length; i++) {
            const row = direction === 'across' ? startRow : startRow + i;
            const col = direction === 'across' ? startCol + i : startCol;
            
            // Check if cell is already filled
            if (grid[row][col] !== null) {
                // If it's a black square, can't place word here
                if (grid[row][col] === '#') return false;
                
                // If it's a letter, must match
                if (grid[row][col] !== word[i]) return false;
                
                hasValidIntersection = true;
            }
        }
        
        // For the first word, we don't need intersections
        // For subsequent words, we must intersect with at least one existing word
        const isFirstWord = grid.every(row => row.every(cell => cell === null));
        if (!isFirstWord && !hasValidIntersection) {
            return false;
        }
        
        // Additional check: ensure we don't create invalid adjacent letter connections
        // But only check immediately adjacent cells, not all surrounding cells
        for (let i = 0; i < word.length; i++) {
            const row = direction === 'across' ? startRow : startRow + i;
            const col = direction === 'across' ? startCol + i : startCol;
            
            // Skip if this position already has a matching letter (valid intersection)
            if (grid[row][col] === word[i]) continue;
            
            // Check for invalid adjacent letters
            if (direction === 'across') {
                // For across words, check above and below
                if (row > 0 && grid[row - 1][col] !== null && grid[row - 1][col] !== '#') {
                    // There's a letter above - this would create an invalid connection
                    return false;
                }
                if (row < size - 1 && grid[row + 1][col] !== null && grid[row + 1][col] !== '#') {
                    // There's a letter below - this would create an invalid connection
                    return false;
                }
            } else {
                // For down words, check left and right
                if (col > 0 && grid[row][col - 1] !== null && grid[row][col - 1] !== '#') {
                    // There's a letter to the left - this would create an invalid connection
                    return false;
                }
                if (col < size - 1 && grid[row][col + 1] !== null && grid[row][col + 1] !== '#') {
                    // There's a letter to the right - this would create an invalid connection
                    return false;
                }
            }
        }
        
        return true;
    }

    async parseWordSelection(response, availableWords = []) {
        try {
            const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            let jsonStr = jsonMatch ? jsonMatch[1] : response;
            
            // Create a set of available word names for quick lookup
            const availableWordSet = new Set(availableWords.map(w => w.word.toUpperCase()));
            
            try {
                // Clean the JSON string of common issues
                jsonStr = jsonStr
                    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
                    .replace(/[\u2018\u2019]/g, "'") // Replace smart quotes
                    .replace(/[\u201C\u201D]/g, '"') // Replace smart double quotes
                    .replace(/[\u2013\u2014]/g, '-') // Replace em/en dashes
                    .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
                    .replace(/\}\s*,\s*\]/g, '}]') // Fix object-array comma issues
                    .replace(/,\s*\}\s*\]/g, '}]') // Fix trailing comma before closing
                    .trim();
                
                const data = JSON.parse(jsonStr);
                if (!data.selectedWords || !Array.isArray(data.selectedWords)) {
                    throw new Error('Invalid word selection format');
                }
                
                // Validate and clean selected words
                const validWords = data.selectedWords
                    .map(w => {
                        if (!w.word || !w.clue || typeof w.length !== 'number') {
                            return null;
                        }
                        const cleanWord = w.word.toUpperCase().trim();
                        
                        // If available words list is provided, check if word is in the list
                        if (availableWords.length > 0 && !availableWordSet.has(cleanWord)) {
                            console.warn(`Word "${cleanWord}" not found in available words list, skipping`);
                            return null;
                        }
                        
                        return {
                            word: cleanWord,
                            clue: w.clue.trim(),
                            length: w.length,
                            reason: w.reason ? w.reason.trim() : ''
                        };
                    })
                    .filter(w => w && w.word.length >= 3);
                
                // If we don't have enough valid words, try to use available words directly
                if (validWords.length < 8 && availableWords.length > 0) {
                    console.log(`Only ${validWords.length} valid words found, supplementing with available words`);
                    
                    // Add words from the available list that weren't selected
                    const selectedWordSet = new Set(validWords.map(w => w.word));
                    const supplementWords = availableWords
                        .filter(w => !selectedWordSet.has(w.word))
                        .slice(0, Math.max(0, 15 - validWords.length))
                        .map(w => ({
                            word: w.word,
                            clue: w.description || `Pista para ${w.word}`,
                            length: w.word.length,
                            reason: 'Palavra suplementar do tema'
                        }));
                    
                    validWords.push(...supplementWords);
                }
                
                if (validWords.length < 8) {
                    throw new Error('Not enough valid words selected');
                }
                
                return validWords;
            } catch (parseError) {
                console.log('JSON parsing failed, asking AI to fix the response');
                
                const expectedFormat = `{
  "selectedWords": [
    {
      "word": "WORD",
      "clue": "clever clue",
      "length": number,
      "reason": "why this word works well"
    }
  ],
  "explanation": "Brief explanation"
}`;
                
                const context = 'This is a word selection for a crossword puzzle, including the words, clues, and explanations.';
                
                const fixedResponse = await this.fixMalformedResponse(response, expectedFormat, context);
                console.log('Fixed word selection received:', fixedResponse);
                
                const fixedJsonMatch = fixedResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
                let fixedJsonStr = fixedJsonMatch ? fixedJsonMatch[1] : fixedResponse;
                
                // Clean the fixed JSON string
                fixedJsonStr = fixedJsonStr
                    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
                    .replace(/[\u2018\u2019]/g, "'") // Replace smart quotes
                    .replace(/[\u201C\u201D]/g, '"') // Replace smart double quotes
                    .replace(/[\u2013\u2014]/g, '-') // Replace em/en dashes
                    .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
                    .replace(/\}\s*,\s*\]/g, '}]') // Fix object-array comma issues
                    .replace(/,\s*\}\s*\]/g, '}]') // Fix trailing comma before closing
                    .trim();
                
                const fixedData = JSON.parse(fixedJsonStr);
                
                if (!fixedData.selectedWords || !Array.isArray(fixedData.selectedWords)) {
                    throw new Error('Invalid fixed word selection format');
                }
                
                // Validate and clean fixed words
                const validFixedWords = fixedData.selectedWords
                    .map(w => {
                        if (!w.word || !w.clue || typeof w.length !== 'number') {
                            return null;
                        }
                        return {
                            word: w.word.toUpperCase().trim(),
                            clue: w.clue.trim(),
                            length: w.length,
                            reason: w.reason ? w.reason.trim() : ''
                        };
                    })
                    .filter(w => w && w.word.length >= 3);
                
                if (validFixedWords.length < 8) {
                    throw new Error('Not enough valid words in fixed selection');
                }
                
                return validFixedWords;
            }
        } catch (e) {
            console.error('Error parsing word selection:', e);
            return [];
        }
    }

    async parseThemeResponse(response) {
        console.log('Parsing theme response:', response);
        
        try {
            // First try to extract JSON from markdown code blocks
            const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            
            try {
                // Clean the JSON string of any control characters
                const cleanJsonStr = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
                    .replace(/[\u2018\u2019]/g, "'")  // Replace smart quotes
                    .replace(/[\u201C\u201D]/g, '"')  // Replace smart double quotes
                    .replace(/[\u2013\u2014]/g, '-'); // Replace em/en dashes
                
                const data = JSON.parse(cleanJsonStr);
                
                if (!data.theme || !data.description || !Array.isArray(data.words)) {
                    console.error('Invalid theme response format - missing required fields');
                    return null;
                }
                
                // Clean and validate words
                const validWords = data.words
                    .map(word => {
                        if (typeof word !== 'string') return null;
                        const [wordPart, ...descParts] = word.split(' - ');
                        if (!wordPart) return null;
                        return {
                            word: wordPart.trim().toUpperCase(),
                            description: descParts.join(' - ').trim()
                        };
                    })
                    .filter(word => word && word.word.length >= 3);
                
                if (validWords.length < 10) {
                    console.error('Not enough valid words in theme response');
                    return null;
                }
                
                console.log('Parsing results:', {
                    theme: data.theme,
                    description: data.description,
                    wordCount: validWords.length,
                    words: validWords
                });
                
                return {
                    theme: data.theme,
                    description: data.description,
                    words: validWords.map(w => `${w.word} - ${w.description}`)
                };
            } catch (parseError) {
                console.log('JSON parsing failed, asking AI to fix the response');
                
                const expectedFormat = `{
  "theme": "Theme name",
  "description": "Brief theme description",
  "words": [
    "WORD1 - brief explanation",
    "WORD2 - brief explanation",
    ...
  ]
}`;
                
                const context = 'This is a theme response for a crossword puzzle, including the theme name, description, and a list of related words with their explanations.';
                
                const fixedResponse = await this.fixMalformedResponse(response, expectedFormat, context);
                console.log('Fixed theme response received:', fixedResponse);
                
                // Try parsing the fixed response
                const fixedJsonMatch = fixedResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
                const fixedJsonStr = fixedJsonMatch ? fixedJsonMatch[1] : fixedResponse;
                
                // Clean the fixed JSON string
                const cleanFixedJsonStr = fixedJsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
                    .replace(/[\u2018\u2019]/g, "'")
                    .replace(/[\u201C\u201D]/g, '"')
                    .replace(/[\u2013\u2014]/g, '-');
                
                const fixedData = JSON.parse(cleanFixedJsonStr);
                
                if (!fixedData.theme || !fixedData.description || !Array.isArray(fixedData.words)) {
                    console.error('Invalid fixed theme response format');
                    return null;
                }
                
                // Clean and validate words from fixed response
                const validFixedWords = fixedData.words
                    .map(word => {
                        if (typeof word !== 'string') return null;
                        const [wordPart, ...descParts] = word.split(' - ');
                        if (!wordPart) return null;
                        return {
                            word: wordPart.trim().toUpperCase(),
                            description: descParts.join(' - ').trim()
                        };
                    })
                    .filter(word => word && word.word.length >= 3);
                
                if (validFixedWords.length < 10) {
                    console.error('Not enough valid words in fixed theme response');
                    return null;
                }
                
                console.log('Fixed parsing results:', {
                    theme: fixedData.theme,
                    description: fixedData.description,
                    wordCount: validFixedWords.length,
                    words: validFixedWords
                });
                
                return {
                    theme: fixedData.theme,
                    description: fixedData.description,
                    words: validFixedWords.map(w => `${w.word} - ${w.description}`)
                };
            }
        } catch (e) {
            console.error('Error parsing theme response:', e);
            return null;
        }
    }

    async validatePuzzleWithAI(puzzle) {
        try {
            // Basic structural validation
            if (!puzzle.grid || !puzzle.clues || !puzzle.theme) {
                return {
                    isValid: false,
                    errors: ['Missing required puzzle components']
                };
            }

            // Validate grid structure
            const grid = puzzle.grid;
            const size = grid.length;
            
            // Check grid dimensions
            if (size !== grid[0].length) {
                return {
                    isValid: false,
                    errors: ['Grid is not square']
                };
            }

            // Check for rotational symmetry
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    if (grid[i][j] !== grid[size - 1 - i][size - 1 - j]) {
                        return {
                            isValid: false,
                            errors: ['Grid lacks rotational symmetry']
                        };
                    }
                }
            }

            // Validate clues
            const clues = puzzle.clues;
            if (!clues.across || !clues.down) {
                return {
                    isValid: false,
                    errors: ['Missing across or down clues']
                };
            }

            // Check that all words in clues exist in the grid
            const gridWords = this.extractWordsFromGrid(grid);
            const clueWords = [...clues.across, ...clues.down].map(c => c.answer);
            
            for (const word of clueWords) {
                if (!gridWords.includes(word)) {
                    return {
                        isValid: false,
                        errors: [`Word "${word}" in clues not found in grid`]
                    };
                }
            }

            // Use AI to validate theme consistency and clue quality
            const validationPrompt = `Validate this crossword puzzle:

            Theme: ${puzzle.theme}
            Description: ${puzzle.description}
            
            Clues:
            ${this.formatCluesForValidation(clues)}
            
            Please check:
            1. Are all clues thematically consistent?
            2. Are the clues appropriate for the difficulty level?
            3. Are there any duplicate words or clues?
            4. Is the theme well-represented in the puzzle?
            
            Format your response as:
            VALID: [yes/no]
            ISSUES:
            - [list any issues found]
            SUGGESTIONS:
            - [list any suggestions for improvement]`;

            const validationResponse = await this.llmClient.generatePuzzle(validationPrompt);
            const aiValidation = this.parseValidationResponse(validationResponse);

            return {
                isValid: aiValidation.isValid,
                errors: aiValidation.issues,
                suggestions: aiValidation.suggestions
            };

        } catch (error) {
            console.error('Error validating puzzle:', error);
            return {
                isValid: false,
                errors: ['Validation failed: ' + error.message]
            };
        }
    }

    extractWordsFromGrid(grid) {
        const words = [];
        const size = grid.length;

        // Extract horizontal words
        for (let i = 0; i < size; i++) {
            let word = '';
            for (let j = 0; j < size; j++) {
                if (grid[i][j] === null) {
                    if (word.length > 1) {
                        words.push(word);
                    }
                    word = '';
                } else {
                    word += grid[i][j];
                }
            }
            if (word.length > 1) {
                words.push(word);
            }
        }

        // Extract vertical words
        for (let j = 0; j < size; j++) {
            let word = '';
            for (let i = 0; i < size; i++) {
                if (grid[i][j] === null) {
                    if (word.length > 1) {
                        words.push(word);
                    }
                    word = '';
                } else {
                    word += grid[i][j];
                }
            }
            if (word.length > 1) {
                words.push(word);
            }
        }

        return words;
    }

    formatCluesForValidation(clues) {
        let formatted = 'ACROSS:\n';
        clues.across.forEach(clue => {
            formatted += `${clue.number}. ${clue.clue} (${clue.answer})\n`;
        });
        
        formatted += '\nDOWN:\n';
        clues.down.forEach(clue => {
            formatted += `${clue.number}. ${clue.clue} (${clue.answer})\n`;
        });
        
        return formatted;
    }

    parseValidationResponse(response) {
        const lines = response.split('\n');
        let isValid = false;
        const issues = [];
        const suggestions = [];
        let currentSection = '';

        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed.startsWith('VALID:')) {
                isValid = trimmed.toLowerCase().includes('yes');
            } else if (trimmed === 'ISSUES:') {
                currentSection = 'issues';
            } else if (trimmed === 'SUGGESTIONS:') {
                currentSection = 'suggestions';
            } else if (trimmed.startsWith('- ')) {
                const content = trimmed.substring(2);
                if (currentSection === 'issues') {
                    issues.push(content);
                } else if (currentSection === 'suggestions') {
                    suggestions.push(content);
                }
            }
        }

        return { isValid, issues, suggestions };
    }

    async fixMalformedResponse(response, expectedFormat, context) {
        const fixPrompt = `I received a malformed response that needs to be fixed. Here's the context:
        ${context}
        
        The response I received was:
        ${response}
        
        Please fix this response to match the following format exactly:
        ${expectedFormat}
        
        Return ONLY the fixed JSON response, with no additional text or explanation.`;
        
        const fixedResponse = await this.llmClient.generatePuzzle(fixPrompt);
        return fixedResponse;
    }

    async getHint() {
        if (!this.ui.currentWord) {
            this.showError(window.i18n ? window.i18n.t('clickClueToStart') : 'Por favor, selecione uma palavra primeiro.');
            return;
        }

        try {
            this.showThinking(true);
            
            const word = this.ui.currentWord;
            const clue = this.engine.getClue(word.number, word.direction);
            const currentAnswer = this.engine.getCurrentAnswer(word.number, word.direction);
            
            let hint;
            if (this.llmClient.isConnected) {
                hint = await this.llmClient.getHint(clue, currentAnswer);
            } else {
                hint = this.generateBasicHint(word, currentAnswer);
            }
            
            this.ui.showHint(hint);
            this.hintsUsed++;
            this.ui.updateStats();
            
            this.showThinking(false);
            
        } catch (error) {
            console.error('Error getting hint:', error);
            this.showError(window.i18n ? window.i18n.t('noHintAvailable') : 'Falha ao obter dica.');
            this.showThinking(false);
        }
    }

    generateBasicHint(word, currentAnswer) {
        const answer = this.engine.getAnswer(word.number, word.direction);
        const filledLetters = currentAnswer.split('').filter(letter => letter !== '').length;
        const totalLetters = answer.length;
        
        if (filledLetters === 0) {
            return `Esta palavra tem ${totalLetters} letras e começa com "${answer[0]}".`;
        } else if (filledLetters < totalLetters / 2) {
            const nextEmptyIndex = currentAnswer.indexOf('');
            if (nextEmptyIndex !== -1) {
                return `A ${nextEmptyIndex + 1}ª letra é "${answer[nextEmptyIndex]}".`;
            }
        } else {
            return `Você está perto! A palavra é "${answer}".`;
        }
        
        return 'Continue tentando! Você consegue!';
    }

    getOrdinalSuffix(num) {
        const suffix = ['th', 'st', 'nd', 'rd'];
        const value = num % 100;
        return suffix[(value - 20) % 10] || suffix[value] || suffix[0];
    }

    checkAnswers() {
        const results = this.engine.checkAllAnswers();
        this.ui.highlightResults(results);
        
        const correct = results.filter(r => r.correct).length;
        const total = results.length;
        
        if (correct === total) {
            this.handlePuzzleComplete();
        } else {
            document.getElementById('status-text').textContent = 
                `${correct} of ${total} words correct`;
        }
    }

    handlePuzzleComplete() {
        const endTime = Date.now();
        const totalTime = Math.floor((endTime - this.startTime) / 1000);
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        
        document.getElementById('final-time').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('final-hints').textContent = this.hintsUsed;
        
        this.showModal();
    }

    handleProviderChange(provider) {
        this.llmClient.setProvider(provider);
        
        const lmstudioSettings = document.getElementById('lmstudio-settings');
        const openaiSettings = document.getElementById('openai-settings');
        
        if (provider === 'openai') {
            lmstudioSettings.style.display = 'none';
            openaiSettings.style.display = 'block';
        } else {
            lmstudioSettings.style.display = 'block';
            openaiSettings.style.display = 'none';
        }
        
        this.updateConnectionStatus();
    }

    async testAIConnection() {
        try {
            document.getElementById('test-connection-btn').disabled = true;
            document.getElementById('test-connection-btn').innerHTML = 
                '<i class="fas fa-spinner fa-spin"></i> Testing...';
            
            // Set connection parameters
            if (this.llmClient.provider === 'openai') {
                const apiKey = document.getElementById('openai-key').value;
                this.llmClient.setOpenAIApiKey(apiKey);
            } else {
                const endpoint = document.getElementById('lmstudio-endpoint').value;
                this.llmClient.setEndpoint(endpoint);
            }
            
            const result = await this.llmClient.testConnection();
            
            if (result.success) {
                this.updateConnectionStatus(true, result.message);
            } else {
                this.updateConnectionStatus(false, result.message);
            }
            
        } catch (error) {
            this.updateConnectionStatus(false, error.message);
        } finally {
            document.getElementById('test-connection-btn').disabled = false;
            document.getElementById('test-connection-btn').innerHTML = 
                '<i class="fas fa-wifi"></i> Test Connection';
        }
    }

    updateConnectionStatus(connected = false, message = 'Not connected') {
        const statusElement = document.getElementById('connection-status');
        const dot = statusElement.querySelector('.connection-dot');
        const text = statusElement.querySelector('span');
        
        if (connected) {
            statusElement.classList.add('connected');
            text.textContent = message;
        } else {
            statusElement.classList.remove('connected');
            text.textContent = message;
        }
    }

    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + N: New puzzle
        if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
            event.preventDefault();
            this.generateNewPuzzle();
        }
        
        // Ctrl/Cmd + H: Get hint
        if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
            event.preventDefault();
            this.getHint();
        }
        
        // Escape: Clear selection
        if (event.key === 'Escape') {
            this.ui.clearSelection();
        }
    }

    showThinking(show) {
        const indicator = document.getElementById('thinking-indicator');
        if (show) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    }

    showError(message) {
        // Simple error display - could be enhanced with a proper notification system
        document.getElementById('status-text').textContent = message;
        document.getElementById('status-text').style.color = 'var(--danger-color)';
        
        setTimeout(() => {
            document.getElementById('status-text').style.color = '';
        }, 3000);
    }

    showModal() {
        document.getElementById('congratulations-modal').classList.add('active');
    }

    closeModal() {
        document.getElementById('congratulations-modal').classList.remove('active');
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
        this.showError('An unexpected error occurred. Please try again.');
        this.showThinking(false);
    }

    handleSettingChange(key, value) {
        switch (key) {
            case 'aiProvider':
                this.llmClient.setProvider(value);
                break;
            case 'lmstudioEndpoint':
                this.llmClient.setEndpoint(value);
                break;
            case 'openaiApiKey':
                this.llmClient.setOpenAIApiKey(value);
                break;
            case 'difficulty':
                this.engine.setDifficulty(value);
                break;
            case 'gridSize':
                this.engine.setGridSize(value);
                break;
        }
    }
}

// Initialize the application
new CrosswordApp();
