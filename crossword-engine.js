class CrosswordEngine {
    constructor() {
        this.grid = [];
        this.clues = { across: [], down: [] };
        this.userAnswers = {};
        this.currentPuzzle = null;
        this.difficulty = 'medium';
        this.gridSize = 'medium';
        this.numbers = {};
        
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
        this.clues = puzzleData.clues;
        this.userAnswers = {};
        this.numbers = this.calculateNumbers();
        
        // Initialize user answers
        [...this.clues.across, ...this.clues.down].forEach(clue => {
            this.userAnswers[`${clue.number}-${clue.direction || (this.clues.across.includes(clue) ? 'across' : 'down')}`] = 
                new Array(clue.answer.length).fill('');
        });
    }

    calculateNumbers() {
        const numbers = {};
        let currentNumber = 1;
        
        for (let row = 0; row < this.grid.length; row++) {
            for (let col = 0; col < this.grid[row].length; col++) {
                // Check if this is a valid cell (not blocked)
                if (this.grid[row][col] !== null && this.grid[row][col] !== '#') {
                    let needsNumber = false;
                    
                    // Check if this cell starts an across word
                    if (col === 0 || this.grid[row][col - 1] === null || this.grid[row][col - 1] === '#') {
                        if (col < this.grid[row].length - 1 && 
                            this.grid[row][col + 1] !== null && 
                            this.grid[row][col + 1] !== '#') {
                            needsNumber = true;
                        }
                    }
                    
                    // Check if this cell starts a down word
                    if (row === 0 || this.grid[row - 1][col] === null || this.grid[row - 1][col] === '#') {
                        if (row < this.grid.length - 1 && 
                            this.grid[row + 1][col] !== null && 
                            this.grid[row + 1][col] !== '#') {
                            needsNumber = true;
                        }
                    }
                    
                    if (needsNumber) {
                        numbers[`${row}-${col}`] = currentNumber++;
                    }
                }
            }
        }
        
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
        // Treat '#' as blocked cells (return null for blocked cells)
        const cellValue = this.grid[row][col];
        return cellValue === '#' ? null : cellValue;
    }

    isCellBlocked(row, col) {
        if (!this.grid || this.grid.length === 0 || !this.grid[0]) {
            return true;
        }
        if (row < 0 || row >= this.grid.length || col < 0 || col >= this.grid[0].length) {
            return true;
        }
        return this.grid[row][col] === '#';
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

    generatePredefinedPuzzle(difficulty, gridSize) {
        // Return a predefined puzzle based on difficulty and size
        return this.getDefaultPuzzle();
    }

    getDefaultPuzzle() {
        return {
            theme: "Simple Words",
            description: "A basic crossword puzzle with common words",
            grid: [
                ["C", "A", "T", null, null],
                ["A", null, "H", null, null],
                ["R", null, "E", null, null],
                [null, null, null, null, null],
                ["D", "O", "G", null, null]
            ],
            clues: {
                across: [
                    { number: 1, clue: "Feline pet", answer: "CAT", startRow: 0, startCol: 0 },
                    { number: 4, clue: "Man's best friend", answer: "DOG", startRow: 4, startCol: 0 }
                ],
                down: [
                    { number: 1, clue: "Vehicle with four wheels", answer: "CAR", startRow: 0, startCol: 0 },
                    { number: 2, clue: "Opposite of cold", answer: "HOT", startRow: 0, startCol: 2 }
                ]
            }
        };
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
