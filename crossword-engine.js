class CrosswordEngine {
    constructor() {
        this.grid = [];
        this.clues = { across: [], down: [] };
        this.userAnswers = {};
        this.currentPuzzle = null;
        this.difficulty = 'medium';
        this.gridSize = 'medium';
        this.numbers = {};
        this.hintsUsed = 0;
        
        this.gridSizes = {
            small: { rows: 11, cols: 11 },
            medium: { rows: 15, cols: 15 },
            large: { rows: 21, cols: 21 }
        };
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }

    setGridSize(size) {
        this.gridSize = size;
    }

    loadPuzzle(puzzleData) {
        this.currentPuzzle = puzzleData;
        this.grid = puzzleData.grid;
        
        // Normalize clues data structure for AI-generated puzzles
        this.clues = this.normalizeClues(puzzleData.clues);
        
        this.userAnswers = {};
        this.numbers = this.calculateNumbers();
        this.hintsUsed = 0; // Reset hints counter
        
        // Initialize user answers
        [...this.clues.across, ...this.clues.down].forEach(clue => {
            this.userAnswers[`${clue.number}-${clue.direction || (this.clues.across.includes(clue) ? 'across' : 'down')}`] = 
                new Array(clue.answer.length).fill('');
        });
    }

    normalizeClues(clues) {
        const normalized = { across: [], down: [] };
        
        if (clues.across) {
            normalized.across = clues.across.map(clue => ({
                number: clue.number,
                clue: clue.clue,
                answer: clue.answer.toUpperCase(),
                startRow: clue.startRow,
                startCol: clue.startCol,
                direction: 'across'
            }));
        }
        
        if (clues.down) {
            normalized.down = clues.down.map(clue => ({
                number: clue.number,
                clue: clue.clue,
                answer: clue.answer.toUpperCase(),
                startRow: clue.startRow,
                startCol: clue.startCol,
                direction: 'down'
            }));
        }
        
        return normalized;
    }

    calculateNumbers() {
        const numbers = {};
        
        // For AI-generated puzzles, use the clue start positions directly
        [...this.clues.across, ...this.clues.down].forEach(clue => {
            const key = `${clue.startRow}-${clue.startCol}`;
            numbers[key] = clue.number;
        });
        
        return numbers;
    }

    getCellNumber(row, col) {
        return this.numbers[`${row}-${col}`] || null;
    }

    getCellValue(row, col) {
        if (!this.grid || this.grid.length === 0 || !this.grid[0]) {
            return null;
        }
        if (row < 0 || row >= this.grid.length || col < 0 || col >= this.grid[0].length) {
            return null;
        }
        const cellValue = this.grid[row][col];
        // For AI-generated puzzles: empty string = valid cell, null/undefined = blocked
        return cellValue;
    }

    isCellBlocked(row, col) {
        if (!this.grid || this.grid.length === 0 || !this.grid[0]) {
            return true;
        }
        if (row < 0 || row >= this.grid.length || col < 0 || col >= this.grid[0].length) {
            return true;
        }
        const cellValue = this.grid[row][col];
        // For AI-generated puzzles: empty string = valid cell, null/undefined = blocked
        return cellValue === null || cellValue === undefined || cellValue === '#';
    }

    getUserAnswer(row, col) {
        // Find which word this cell belongs to and return the user's answer
        const acrossWord = this.findWordAt(row, col, 'across');
        const downWord = this.findWordAt(row, col, 'down');
        
        if (acrossWord) {
            const userAnswer = this.userAnswers[`${acrossWord.number}-across`];
            const cellIndex = col - acrossWord.startCol;
            return userAnswer[cellIndex] || '';
        }
        
        if (downWord) {
            const userAnswer = this.userAnswers[`${downWord.number}-down`];
            const cellIndex = row - downWord.startRow;
            return userAnswer[cellIndex] || '';
        }
        
        return '';
    }

    setUserAnswer(number, direction, answer) {
        const key = `${number}-${direction}`;
        this.userAnswers[key] = answer.toUpperCase().split('');
        
        // Ensure array is the correct length
        const clue = this.getClueData(number, direction);
        if (clue) {
            while (this.userAnswers[key].length < clue.answer.length) {
                this.userAnswers[key].push('');
            }
            this.userAnswers[key] = this.userAnswers[key].slice(0, clue.answer.length);
        }
    }

    getCurrentAnswer(number, direction) {
        const key = `${number}-${direction}`;
        return this.userAnswers[key] ? this.userAnswers[key].join('') : '';
    }

    getClue(number, direction) {
        const clueList = direction === 'across' ? this.clues.across : this.clues.down;
        const clue = clueList.find(c => c.number === number);
        return clue ? clue.clue : '';
    }

    getAnswer(number, direction) {
        const clueList = direction === 'across' ? this.clues.across : this.clues.down;
        const clue = clueList.find(c => c.number === number);
        return clue ? clue.answer : '';
    }

    getClueData(number, direction) {
        const clueList = direction === 'across' ? this.clues.across : this.clues.down;
        return clueList.find(c => c.number === number);
    }

    findWordAt(row, col, direction) {
        const clueList = direction === 'across' ? this.clues.across : this.clues.down;
        
        return clueList.find(clue => {
            if (direction === 'across') {
                return row === clue.startRow && 
                       col >= clue.startCol && 
                       col < clue.startCol + clue.answer.length;
            } else {
                return col === clue.startCol && 
                       row >= clue.startRow && 
                       row < clue.startRow + clue.answer.length;
            }
        });
    }

    getWordCells(number, direction) {
        const clue = this.getClueData(number, direction);
        if (!clue) return [];
        
        const cells = [];
        if (direction === 'across') {
            for (let col = clue.startCol; col < clue.startCol + clue.answer.length; col++) {
                cells.push({ row: clue.startRow, col });
            }
        } else {
            for (let row = clue.startRow; row < clue.startRow + clue.answer.length; row++) {
                cells.push({ row, col: clue.startCol });
            }
        }
        
        return cells;
    }

    checkAnswer(number, direction) {
        const correctAnswer = this.getAnswer(number, direction);
        const userAnswer = this.getCurrentAnswer(number, direction);
        return correctAnswer === userAnswer;
    }

    checkAllAnswers() {
        const results = [];
        
        [...this.clues.across, ...this.clues.down].forEach(clue => {
            const direction = this.clues.across.includes(clue) ? 'across' : 'down';
            const correct = this.checkAnswer(clue.number, direction);
            results.push({
                number: clue.number,
                direction,
                correct,
                userAnswer: this.getCurrentAnswer(clue.number, direction),
                correctAnswer: clue.answer
            });
        });
        
        return results;
    }

    getProgress() {
        const total = this.clues.across.length + this.clues.down.length;
        const completed = this.checkAllAnswers().filter(r => r.correct).length;
        return { completed, total, percentage: Math.round((completed / total) * 100) };
    }

    isPuzzleComplete() {
        const results = this.checkAllAnswers();
        return results.every(r => r.correct);
    }

    getTotalWords() {
        return this.clues.across.length + this.clues.down.length;
    }

    getCompletedWords() {
        return this.checkAllAnswers().filter(r => r.correct).length;
    }

    getHintsUsed() {
        return this.hintsUsed || 0;
    }

    incrementHints() {
        this.hintsUsed = (this.hintsUsed || 0) + 1;
    }

    generatePredefinedPuzzle(difficulty, gridSize) {
        // Return a predefined puzzle based on difficulty and size
        return this.getDefaultPuzzle();
    }

    getDefaultPuzzle() {
        // Return a language-aware predefined puzzle
        const isPortuguese = window.i18n ? window.i18n.getCurrentLanguage() === 'pt' : true;
        
        if (isPortuguese) {
            return {
                theme: "Palavras Cruzadas Clássicas",
                description: "Uma palavra cruzada tradicional com palavras comuns",
                grid: [
                    ["G", "A", "T", "O", null, "C", "A", "O", null, "P", "A", "S", "S", "A", "R"],
                    ["A", null, "R", null, null, "A", null, "V", null, "E", null, "O", null, "V", null],
                    ["T", null, "V", null, null, "S", null, "O", null, "N", null, "L", null, "O", null],
                    ["O", null, "O", null, null, "A", null, null, null, null, null, null, null, null, null],
                    [null, null, "R", null, null, null, null, null, null, null, null, null, null, null, null],
                    ["C", "A", "S", "A", null, "A", "R", "V", "O", "R", "E", null, "S", "O", "L"],
                    ["A", null, null, null, null, "G", null, "I", null, "U", null, null, "A", null, "I"],
                    ["R", null, null, null, null, "U", null, "D", null, "A", null, null, "P", null, "V"],
                    ["R", null, null, null, null, "A", null, "A", null, null, null, null, "O", null, "R"],
                    ["O", null, null, null, null, null, null, null, null, null, null, null, null, null, "O"],
                    [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                    ["L", "I", "V", "R", "O", null, "C", "A", "N", "E", "T", "A", null, "M", "E"],
                    ["I", null, "I", null, null, null, "A", null, "O", null, "E", null, null, "E", null],
                    ["V", null, "R", null, null, null, "D", null, "M", null, "S", null, null, "S", null],
                    ["R", null, null, null, null, null, "A", null, "E", null, "A", null, null, "A", null]
                ],
                clues: {
                    across: [
                        { number: 1, clue: "Animal doméstico felino", answer: "GATO", startRow: 0, startCol: 0 },
                        { number: 5, clue: "Animal doméstico que late", answer: "CAO", startRow: 0, startCol: 5 },
                        { number: 9, clue: "Mover-se de um lugar para outro", answer: "PASSAR", startRow: 0, startCol: 9 },
                        { number: 15, clue: "Local onde moramos", answer: "CASA", startRow: 5, startCol: 0 },
                        { number: 19, clue: "Planta grande com folhas", answer: "ARVORE", startRow: 5, startCol: 5 },
                        { number: 25, clue: "Astro que nos dá luz", answer: "SOL", startRow: 5, startCol: 12 },
                        { number: 28, clue: "Objeto para leitura", answer: "LIVRO", startRow: 11, startCol: 0 },
                        { number: 33, clue: "Instrumento de escrita", answer: "CANETA", startRow: 11, startCol: 6 },
                        { number: 39, clue: "Móvel para refeições", answer: "MESA", startRow: 11, startCol: 13 }
                    ],
                    down: [
                        { number: 1, clue: "Animal doméstico felino", answer: "GATO", startRow: 0, startCol: 0 },
                        { number: 2, clue: "Veículo de quatro rodas", answer: "CARRO", startRow: 0, startCol: 1 },
                        { number: 3, clue: "Planta que cresce alto", answer: "ARVORE", startRow: 0, startCol: 2 },
                        { number: 6, clue: "Líquido transparente", answer: "AGUA", startRow: 0, startCol: 5 },
                        { number: 10, clue: "Instrumento para escrever", answer: "PENA", startRow: 0, startCol: 9 },
                        { number: 16, clue: "Veículo de transporte", answer: "CARRO", startRow: 5, startCol: 0 },
                        { number: 20, clue: "Líquido essencial", answer: "AGUA", startRow: 5, startCol: 5 },
                        { number: 26, clue: "Calçado para os pés", answer: "SAPO", startRow: 5, startCol: 12 },
                        { number: 29, clue: "Texto escrito", answer: "LIVRO", startRow: 11, startCol: 0 },
                        { number: 34, clue: "Utensílio de mesa", answer: "CANETA", startRow: 11, startCol: 6 },
                        { number: 40, clue: "Superfície de trabalho", answer: "MESA", startRow: 11, startCol: 13 }
                    ]
                }
            };
        } else {
            // English version
            return {
                theme: "Classic Crossword",
                description: "A traditional crossword puzzle with common words",
                grid: [
                    ["C", "A", "T", null, "D", "O", "G", null, "B", "I", "R", "D", null, "F", "I"],
                    ["A", null, "H", null, "O", null, "A", null, "I", null, "A", null, null, "I", null],
                    ["R", null, "E", null, "G", null, "T", null, "R", null, "T", null, null, "S", null],
                    ["P", null, "S", null, null, null, null, null, "D", null, "E", null, null, "H", null],
                    [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                    ["H", "O", "U", "S", "E", null, "T", "R", "E", "E", null, "S", "T", "A", "R"],
                    ["O", null, "S", null, "A", null, "R", null, "E", null, null, "T", null, "R", null],
                    ["N", null, "E", null, "R", null, "E", null, "E", null, null, "A", null, "E", null],
                    ["E", null, null, null, null, null, null, null, null, null, null, "R", null, null, null],
                    [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                    ["B", "O", "O", "K", null, "P", "E", "N", null, "D", "E", "S", "K", null, "C"],
                    ["O", null, "O", null, null, "E", null, "E", null, "E", null, "E", null, null, "H"],
                    ["O", null, "K", null, null, "N", null, "N", null, "S", null, "K", null, null, "A"],
                    ["K", null, null, null, null, null, null, null, null, "K", null, null, null, null, "I"],
                    [null, null, null, null, null, null, null, null, null, null, null, null, null, null, "R"]
                ],
                clues: {
                    across: [
                        { number: 1, clue: "Feline pet", answer: "CAT", startRow: 0, startCol: 0 },
                        { number: 4, clue: "Man's best friend", answer: "DOG", startRow: 0, startCol: 4 },
                        { number: 7, clue: "Flying animal", answer: "BIRD", startRow: 0, startCol: 8 },
                        { number: 11, clue: "Aquatic animal", answer: "FISH", startRow: 0, startCol: 13 },
                        { number: 15, clue: "Where you live", answer: "HOUSE", startRow: 5, startCol: 0 },
                        { number: 20, clue: "Tall plant", answer: "TREE", startRow: 5, startCol: 6 },
                        { number: 24, clue: "Bright object in sky", answer: "STAR", startRow: 5, startCol: 11 },
                        { number: 28, clue: "Reading material", answer: "BOOK", startRow: 10, startCol: 0 },
                        { number: 32, clue: "Writing tool", answer: "PEN", startRow: 10, startCol: 5 },
                        { number: 35, clue: "Work surface", answer: "DESK", startRow: 10, startCol: 9 },
                        { number: 39, clue: "Sitting furniture", answer: "CHAIR", startRow: 10, startCol: 14 }
                    ],
                    down: [
                        { number: 1, clue: "Vehicle with four wheels", answer: "CAR", startRow: 0, startCol: 0 },
                        { number: 2, clue: "Opposite of cold", answer: "HOT", startRow: 0, startCol: 2 },
                        { number: 3, clue: "Animal home", answer: "HORSE", startRow: 0, startCol: 4 },
                        { number: 5, clue: "Plant part", answer: "ROOT", startRow: 0, startCol: 6 },
                        { number: 8, clue: "Celestial body", answer: "SUN", startRow: 0, startCol: 8 },
                        { number: 12, clue: "Night sky object", answer: "MARS", startRow: 0, startCol: 12 },
                        { number: 16, clue: "Building material", answer: "STONE", startRow: 5, startCol: 0 },
                        { number: 21, clue: "Writing surface", answer: "PAPER", startRow: 5, startCol: 6 },
                        { number: 25, clue: "Study furniture", answer: "TABLE", startRow: 5, startCol: 11 },
                        { number: 29, clue: "Reading place", answer: "BED", startRow: 5, startCol: 14 },
                        { number: 33, clue: "Writing instrument", answer: "PENCIL", startRow: 10, startCol: 0 },
                        { number: 37, clue: "Office furniture", answer: "LAMP", startRow: 10, startCol: 5 },
                        { number: 40, clue: "Storage furniture", answer: "SHELF", startRow: 10, startCol: 9 },
                        { number: 44, clue: "Resting place", answer: "SOFA", startRow: 10, startCol: 14 }
                    ]
                }
            };
        }
    }

    // Debug methods
    printGrid() {
        console.log('Grid:');
        this.grid.forEach((row, i) => {
            console.log(i, row.map(cell => cell === null ? '█' : (cell === '' ? '□' : cell)).join(' '));
        });
    }

    printUserAnswers() {
        console.log('User Answers:');
        Object.entries(this.userAnswers).forEach(([key, answer]) => {
            console.log(key, answer.join(''));
        });
    }
}
