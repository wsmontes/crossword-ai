// Utility functions for crossword puzzle operations

class CrosswordUtils {
    // Grid validation and manipulation
    static validateGrid(grid) {
        if (!Array.isArray(grid) || grid.length === 0) {
            return { valid: false, error: 'Grid must be a non-empty array' };
        }

        const rows = grid.length;
        const cols = grid[0].length;

        // Check rectangular grid
        for (let i = 0; i < rows; i++) {
            if (!Array.isArray(grid[i]) || grid[i].length !== cols) {
                return { valid: false, error: `Row ${i} has incorrect length` };
            }
        }

        // Check for valid cell values
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = grid[row][col];
                if (cell !== null && cell !== '' && typeof cell !== 'string') {
                    return { valid: false, error: `Invalid cell value at (${row}, ${col})` };
                }
            }
        }

        return { valid: true };
    }

    static createEmptyGrid(rows, cols) {
        return Array(rows).fill(null).map(() => Array(cols).fill(''));
    }

    static copyGrid(grid) {
        return grid.map(row => [...row]);
    }

    // Word placement and validation
    static canPlaceWord(grid, word, row, col, direction) {
        const rows = grid.length;
        const cols = grid[0].length;

        if (direction === 'across') {
            // Check if word fits horizontally
            if (col + word.length > cols) return false;

            // Check if placement conflicts with blocked cells
            for (let i = 0; i < word.length; i++) {
                if (grid[row][col + i] === null) return false;
            }

            // Check for proper word boundaries
            if (col > 0 && grid[row][col - 1] !== null) return false;
            if (col + word.length < cols && grid[row][col + word.length] !== null) return false;

        } else { // down
            // Check if word fits vertically
            if (row + word.length > rows) return false;

            // Check if placement conflicts with blocked cells
            for (let i = 0; i < word.length; i++) {
                if (grid[row + i][col] === null) return false;
            }

            // Check for proper word boundaries
            if (row > 0 && grid[row - 1][col] !== null) return false;
            if (row + word.length < rows && grid[row + word.length][col] !== null) return false;
        }

        return true;
    }

    static placeWord(grid, word, row, col, direction) {
        const newGrid = this.copyGrid(grid);

        if (direction === 'across') {
            for (let i = 0; i < word.length; i++) {
                newGrid[row][col + i] = word[i];
            }
        } else {
            for (let i = 0; i < word.length; i++) {
                newGrid[row + i][col] = word[i];
            }
        }

        return newGrid;
    }

    // Clue validation
    static validateClues(clues, grid) {
        const errors = [];

        ['across', 'down'].forEach(direction => {
            if (!clues[direction] || !Array.isArray(clues[direction])) {
                errors.push(`Missing or invalid ${direction} clues`);
                return;
            }

            clues[direction].forEach((clue, index) => {
                // Check required fields
                if (typeof clue.number !== 'number') {
                    errors.push(`${direction} clue ${index}: missing or invalid number`);
                }
                if (typeof clue.clue !== 'string' || clue.clue.trim() === '') {
                    errors.push(`${direction} clue ${index}: missing or invalid clue text`);
                }
                if (typeof clue.answer !== 'string' || clue.answer.trim() === '') {
                    errors.push(`${direction} clue ${index}: missing or invalid answer`);
                }
                if (typeof clue.startRow !== 'number' || clue.startRow < 0) {
                    errors.push(`${direction} clue ${index}: invalid startRow`);
                }
                if (typeof clue.startCol !== 'number' || clue.startCol < 0) {
                    errors.push(`${direction} clue ${index}: invalid startCol`);
                }

                // Check if answer fits in grid
                if (grid && clue.answer && clue.startRow !== undefined && clue.startCol !== undefined) {
                    if (!this.canPlaceWord(grid, clue.answer, clue.startRow, clue.startCol, direction)) {
                        errors.push(`${direction} clue ${index}: answer doesn't fit at specified position`);
                    }
                }
            });
        });

        return errors;
    }

    // Pattern matching and word finding
    static matchesPattern(word, pattern) {
        if (word.length !== pattern.length) return false;

        for (let i = 0; i < word.length; i++) {
            if (pattern[i] !== '' && pattern[i] !== word[i]) {
                return false;
            }
        }

        return true;
    }

    static findPossibleWords(pattern, dictionary) {
        if (!dictionary || !Array.isArray(dictionary)) {
            return [];
        }

        return dictionary.filter(word => this.matchesPattern(word.toUpperCase(), pattern.toUpperCase()));
    }

    // Grid analysis
    static analyzeGrid(grid) {
        const rows = grid.length;
        const cols = grid[0].length;
        let totalCells = 0;
        let blockedCells = 0;
        let emptyCells = 0;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                totalCells++;
                if (grid[row][col] === null) {
                    blockedCells++;
                } else if (grid[row][col] === '') {
                    emptyCells++;
                }
            }
        }

        const openCells = totalCells - blockedCells;
        const filledCells = openCells - emptyCells;

        return {
            dimensions: { rows, cols },
            totalCells,
            blockedCells,
            openCells,
            emptyCells,
            filledCells,
            blockPercentage: Math.round((blockedCells / totalCells) * 100),
            fillPercentage: Math.round((filledCells / openCells) * 100)
        };
    }

    static findWords(grid) {
        const words = [];
        const rows = grid.length;
        const cols = grid[0].length;

        // Find across words
        for (let row = 0; row < rows; row++) {
            let currentWord = '';
            let startCol = -1;

            for (let col = 0; col <= cols; col++) {
                const cell = col < cols ? grid[row][col] : null;

                if (cell !== null && cell !== '') {
                    if (currentWord === '') {
                        startCol = col;
                    }
                    currentWord += cell;
                } else {
                    if (currentWord.length > 1) {
                        words.push({
                            word: currentWord,
                            row,
                            startCol,
                            direction: 'across',
                            length: currentWord.length
                        });
                    }
                    currentWord = '';
                    startCol = -1;
                }
            }
        }

        // Find down words
        for (let col = 0; col < cols; col++) {
            let currentWord = '';
            let startRow = -1;

            for (let row = 0; row <= rows; row++) {
                const cell = row < rows ? grid[row][col] : null;

                if (cell !== null && cell !== '') {
                    if (currentWord === '') {
                        startRow = row;
                    }
                    currentWord += cell;
                } else {
                    if (currentWord.length > 1) {
                        words.push({
                            word: currentWord,
                            startRow,
                            col,
                            direction: 'down',
                            length: currentWord.length
                        });
                    }
                    currentWord = '';
                    startRow = -1;
                }
            }
        }

        return words;
    }

    // Symmetry checking
    static hasRotationalSymmetry(grid) {
        const rows = grid.length;
        const cols = grid[0].length;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const originalCell = grid[row][col];
                const symmetricCell = grid[rows - 1 - row][cols - 1 - col];

                // Check if both are blocked or both are open
                const originalBlocked = originalCell === null;
                const symmetricBlocked = symmetricCell === null;

                if (originalBlocked !== symmetricBlocked) {
                    return false;
                }
            }
        }

        return true;
    }

    static hasMirrorSymmetry(grid, axis = 'vertical') {
        const rows = grid.length;
        const cols = grid[0].length;

        if (axis === 'vertical') {
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < Math.floor(cols / 2); col++) {
                    const leftCell = grid[row][col];
                    const rightCell = grid[row][cols - 1 - col];

                    const leftBlocked = leftCell === null;
                    const rightBlocked = rightCell === null;

                    if (leftBlocked !== rightBlocked) {
                        return false;
                    }
                }
            }
        } else { // horizontal
            for (let row = 0; row < Math.floor(rows / 2); row++) {
                for (let col = 0; col < cols; col++) {
                    const topCell = grid[row][col];
                    const bottomCell = grid[rows - 1 - row][col];

                    const topBlocked = topCell === null;
                    const bottomBlocked = bottomCell === null;

                    if (topBlocked !== bottomBlocked) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    // Number calculation
    static calculateNumbers(grid) {
        const numbers = {};
        const rows = grid.length;
        const cols = grid[0].length;
        let currentNumber = 1;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (grid[row][col] === null) continue;

                let needsNumber = false;

                // Check if this starts an across word
                const startsAcross = (col === 0 || grid[row][col - 1] === null) &&
                                   (col < cols - 1 && grid[row][col + 1] !== null);

                // Check if this starts a down word
                const startsDown = (row === 0 || grid[row - 1][col] === null) &&
                                 (row < rows - 1 && grid[row + 1][col] !== null);

                if (startsAcross || startsDown) {
                    numbers[`${row}-${col}`] = currentNumber++;
                }
            }
        }

        return numbers;
    }

    // Difficulty assessment
    static assessDifficulty(clues) {
        let totalScore = 0;
        let wordCount = 0;

        const assessClue = (clue) => {
            let score = 50; // Base score

            // Word length factor
            if (clue.answer.length <= 3) score += 10;
            else if (clue.answer.length >= 8) score += 20;

            // Clue complexity (simple heuristics)
            const clueText = clue.clue.toLowerCase();
            
            // Question marks often indicate wordplay
            if (clueText.includes('?')) score += 15;
            
            // Quotation marks often indicate phrases or colloquialisms
            if (clueText.includes('"')) score += 10;
            
            // Abbreviation indicators
            if (clueText.includes('abbr') || clueText.includes('short')) score += 15;
            
            // Fill-in-the-blank clues are usually easier
            if (clueText.includes('___') || clueText.includes('blank')) score -= 10;
            
            // Definition clues with "is" or "are" tend to be straightforward
            if (clueText.includes(' is ') || clueText.includes(' are ')) score -= 5;

            return Math.max(0, Math.min(100, score));
        };

        [...clues.across, ...clues.down].forEach(clue => {
            totalScore += assessClue(clue);
            wordCount++;
        });

        const averageScore = wordCount > 0 ? totalScore / wordCount : 50;
        
        if (averageScore < 40) return 'easy';
        if (averageScore < 60) return 'medium';
        return 'hard';
    }

    // String utilities
    static normalizeAnswer(answer) {
        return answer.toUpperCase().replace(/[^A-Z]/g, '');
    }

    static formatClueNumber(number, direction) {
        return `${number}${direction === 'across' ? 'A' : 'D'}`;
    }

    static parseClueReference(reference) {
        const match = reference.match(/^(\d+)([AD])$/);
        if (match) {
            return {
                number: parseInt(match[1]),
                direction: match[2] === 'A' ? 'across' : 'down'
            };
        }
        return null;
    }

    // Grid generation helpers
    static generateBlockPattern(rows, cols, density = 0.2) {
        const grid = this.createEmptyGrid(rows, cols);
        const targetBlocks = Math.floor(rows * cols * density);
        let blocksPlaced = 0;

        // Place blocks randomly while maintaining symmetry
        while (blocksPlaced < targetBlocks) {
            const row = Math.floor(Math.random() * rows);
            const col = Math.floor(Math.random() * cols);

            if (grid[row][col] === '') {
                grid[row][col] = null;
                
                // Add symmetric block for rotational symmetry
                const symRow = rows - 1 - row;
                const symCol = cols - 1 - col;
                if (grid[symRow][symCol] === '') {
                    grid[symRow][symCol] = null;
                    blocksPlaced += 2;
                } else {
                    blocksPlaced += 1;
                }
            }
        }

        return grid;
    }

    // Export/Import utilities
    static gridToString(grid) {
        return grid.map(row => 
            row.map(cell => cell === null ? '#' : (cell === '' ? '.' : cell)).join('')
        ).join('\n');
    }

    static stringToGrid(str) {
        return str.split('\n').map(line => 
            line.split('').map(char => {
                if (char === '#') return null;
                if (char === '.') return '';
                return char;
            })
        );
    }

    // Performance utilities
    static measurePerformance(fn, ...args) {
        const start = performance.now();
        const result = fn(...args);
        const end = performance.now();
        
        return {
            result,
            duration: end - start
        };
    }

    // Debug utilities
    static printGrid(grid, title = 'Grid') {
        console.log(`\n${title}:`);
        console.log('  ' + Array.from({length: grid[0].length}, (_, i) => i % 10).join(''));
        grid.forEach((row, i) => {
            const rowStr = row.map(cell => {
                if (cell === null) return '█';
                if (cell === '') return '·';
                return cell;
            }).join('');
            console.log(`${i % 10} ${rowStr}`);
        });
    }

    static validatePuzzleStructure(puzzle) {
        const errors = [];

        // Check basic structure
        if (!puzzle.grid) errors.push('Missing grid');
        if (!puzzle.clues) errors.push('Missing clues');
        if (!puzzle.clues.across) errors.push('Missing across clues');
        if (!puzzle.clues.down) errors.push('Missing down clues');

        if (errors.length > 0) return { valid: false, errors };

        // Validate grid
        const gridValidation = this.validateGrid(puzzle.grid);
        if (!gridValidation.valid) {
            errors.push(`Grid validation: ${gridValidation.error}`);
        }

        // Validate clues
        const clueErrors = this.validateClues(puzzle.clues, puzzle.grid);
        errors.push(...clueErrors);

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrosswordUtils;
}
