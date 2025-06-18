class GridManager {
    constructor(engine) {
        this.engine = engine;
        this.gridElement = document.getElementById('crossword-grid');
    }

    render() {
        if (!this.engine.grid || this.engine.grid.length === 0) {
            console.warn('No grid data to render');
            return;
        }

        const grid = this.engine.grid;
        const rows = grid.length;
        const cols = grid[0] ? grid[0].length : 0;

        // Set CSS grid dimensions - adaptive to puzzle size
        const cellSize = `clamp(24px, ${Math.min(3.5, 50/Math.max(rows, cols))}vmin, 40px)`;
        this.gridElement.style.gridTemplateColumns = `repeat(${cols}, ${cellSize})`;
        this.gridElement.style.gridTemplateRows = `repeat(${rows}, ${cellSize})`;
        
        // Center the grid and ensure it fits in the container
        this.gridElement.style.justifySelf = 'center';
        this.gridElement.style.alignSelf = 'center';

        // Clear existing grid
        this.gridElement.innerHTML = '';

        // Create cells
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = this.createCell(row, col);
                this.gridElement.appendChild(cell);
            }
        }
    }

    createCell(row, col) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = row;
        cell.dataset.col = col;

        const isBlocked = this.engine.isCellBlocked(row, col);
        
        if (isBlocked) {
            // Blocked cell
            cell.classList.add('blocked');
        } else {
            // Active cell
            cell.setAttribute('tabindex', '0');
            
            // Add cell number if it exists
            const cellNumber = this.engine.getCellNumber(row, col);
            if (cellNumber) {
                const numberSpan = document.createElement('span');
                numberSpan.className = 'cell-number';
                numberSpan.textContent = cellNumber;
                cell.appendChild(numberSpan);
            }

            // Set initial content - show user answer if any
            const userAnswer = this.engine.getUserAnswer(row, col);
            if (userAnswer) {
                // If there's a number, preserve it
                if (cellNumber) {
                    const numberSpan = cell.querySelector('.cell-number');
                    cell.textContent = userAnswer;
                    if (numberSpan) {
                        cell.appendChild(numberSpan);
                    }
                } else {
                    cell.textContent = userAnswer;
                }
            }

            // Add keyboard event listeners
            cell.addEventListener('keydown', (e) => {
                this.handleCellKeydown(e, row, col);
            });
            
            // Add click event listener
            cell.addEventListener('click', (e) => {
                this.selectCell(row, col);
            });
        }

        return cell;
    }

    handleCellKeydown(event, row, col) {
        const cell = event.target;
        
        // Handle letter input
        if (event.key.length === 1 && event.key.match(/[a-zA-Z]/)) {
            event.preventDefault();
            const letter = event.key.toUpperCase();
            this.setCellLetter(row, col, letter);
            this.moveToNextCell(row, col);
        }
        // Handle backspace
        else if (event.key === 'Backspace') {
            event.preventDefault();
            this.setCellLetter(row, col, '');
            this.moveToPreviousCell(row, col);
        }
        // Handle delete
        else if (event.key === 'Delete') {
            event.preventDefault();
            this.setCellLetter(row, col, '');
        }
        // Handle arrow keys
        else if (event.key.startsWith('Arrow')) {
            event.preventDefault();
            this.handleArrowKey(event.key, row, col);
        }
        // Handle space (toggle direction)
        else if (event.key === ' ') {
            event.preventDefault();
            this.toggleDirection(row, col);
        }
    }

    setCellLetter(row, col, letter) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell && !cell.classList.contains('blocked')) {
            // Update visual
            const numberSpan = cell.querySelector('.cell-number');
            cell.textContent = letter;
            if (numberSpan) {
                cell.appendChild(numberSpan);
            }

            // Update engine data
            this.updateEngineFromCell(row, col, letter);

            // Add animation
            if (letter) {
                cell.classList.add('animate');
                setTimeout(() => cell.classList.remove('animate'), 200);
            }
        }
    }

    updateEngineFromCell(row, col, letter) {
        // Find which word(s) this cell belongs to and update them
        const acrossWord = this.engine.findWordAt(row, col, 'across');
        const downWord = this.engine.findWordAt(row, col, 'down');

        if (acrossWord) {
            const currentAnswer = this.engine.getCurrentAnswer(acrossWord.number, 'across');
            const cellIndex = col - acrossWord.startCol;
            const newAnswer = currentAnswer.split('');
            newAnswer[cellIndex] = letter;
            this.engine.setUserAnswer(acrossWord.number, 'across', newAnswer.join(''));
        }

        if (downWord) {
            const currentAnswer = this.engine.getCurrentAnswer(downWord.number, 'down');
            const cellIndex = row - downWord.startRow;
            const newAnswer = currentAnswer.split('');
            newAnswer[cellIndex] = letter;
            this.engine.setUserAnswer(downWord.number, 'down', newAnswer.join(''));
        }
    }

    moveToNextCell(row, col) {
        // Determine direction based on current selection or default to across
        const direction = this.getCurrentDirection() || 'across';
        
        if (direction === 'across') {
            const nextCol = col + 1;
            if (nextCol < this.engine.grid[0].length && this.engine.getCellValue(row, nextCol) !== null) {
                this.focusCell(row, nextCol);
            }
        } else {
            const nextRow = row + 1;
            if (nextRow < this.engine.grid.length && this.engine.getCellValue(nextRow, col) !== null) {
                this.focusCell(nextRow, col);
            }
        }
    }

    moveToPreviousCell(row, col) {
        const direction = this.getCurrentDirection() || 'across';
        
        if (direction === 'across') {
            const prevCol = col - 1;
            if (prevCol >= 0 && this.engine.getCellValue(row, prevCol) !== null) {
                this.focusCell(row, prevCol);
            }
        } else {
            const prevRow = row - 1;
            if (prevRow >= 0 && this.engine.getCellValue(prevRow, col) !== null) {
                this.focusCell(prevRow, col);
            }
        }
    }

    handleArrowKey(key, row, col) {
        let newRow = row;
        let newCol = col;

        switch (key) {
            case 'ArrowUp':
                newRow = Math.max(0, row - 1);
                break;
            case 'ArrowDown':
                newRow = Math.min(this.engine.grid.length - 1, row + 1);
                break;
            case 'ArrowLeft':
                newCol = Math.max(0, col - 1);
                break;
            case 'ArrowRight':
                newCol = Math.min(this.engine.grid[0].length - 1, col + 1);
                break;
        }

        // Only move if the target cell is not blocked
        if (this.engine.getCellValue(newRow, newCol) !== null) {
            this.focusCell(newRow, newCol);
        }
    }

    focusCell(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell && !cell.classList.contains('blocked')) {
            cell.focus();
        }
    }

    toggleDirection(row, col) {
        // Toggle between across and down word selection at this cell
        const acrossWord = this.engine.findWordAt(row, col, 'across');
        const downWord = this.engine.findWordAt(row, col, 'down');
        
        if (acrossWord && downWord) {
            const currentDirection = this.getCurrentDirection();
            const newDirection = currentDirection === 'across' ? 'down' : 'across';
            const targetWord = newDirection === 'across' ? acrossWord : downWord;
            
            // Trigger word selection
            const event = new CustomEvent('wordSelect', {
                detail: {
                    number: targetWord.number,
                    direction: newDirection
                }
            });
            document.dispatchEvent(event);
        }
    }

    getCurrentDirection() {
        // Get current direction from UI state
        const directionElement = document.getElementById('current-word-direction');
        return directionElement ? directionElement.textContent.toLowerCase() : null;
    }

    highlightWord(number, direction) {
        // Clear previous highlights
        this.clearHighlights();
        
        // Highlight cells for the specified word
        const cells = this.engine.getWordCells(number, direction);
        cells.forEach(({ row, col }) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('highlighted');
            }
        });
    }

    selectCell(row, col) {
        // Clear previous selection
        this.clearSelection();
        
        // Select the specified cell
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add('selected');
        }
    }

    clearHighlights() {
        document.querySelectorAll('.cell.highlighted, .cell.active-word').forEach(cell => {
            cell.classList.remove('highlighted', 'active-word');
        });
    }

    clearSelection() {
        document.querySelectorAll('.cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
    }

    markCellsAsCorrect(cells) {
        cells.forEach(({ row, col }) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('correct');
                cell.classList.remove('incorrect');
            }
        });
    }

    markCellsAsIncorrect(cells) {
        cells.forEach(({ row, col }) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.classList.add('incorrect');
                cell.classList.remove('correct');
            }
        });
    }

    clearValidationStyles() {
        document.querySelectorAll('.cell.correct, .cell.incorrect').forEach(cell => {
            cell.classList.remove('correct', 'incorrect');
        });
    }

    refreshGrid() {
        // Refresh the grid with current user answers
        for (let row = 0; row < this.engine.grid.length; row++) {
            for (let col = 0; col < this.engine.grid[0].length; col++) {
                if (this.engine.getCellValue(row, col) !== null) {
                    const userAnswer = this.engine.getUserAnswer(row, col);
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (cell) {
                        const numberSpan = cell.querySelector('.cell-number');
                        cell.textContent = userAnswer;
                        if (numberSpan) {
                            cell.appendChild(numberSpan);
                        }
                    }
                }
            }
        }
    }

    // Animation methods
    animateCell(row, col, animationType = 'animate') {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add(animationType);
            setTimeout(() => cell.classList.remove(animationType), 300);
        }
    }

    pulseWord(number, direction) {
        const cells = this.engine.getWordCells(number, direction);
        cells.forEach(({ row, col }, index) => {
            setTimeout(() => {
                this.animateCell(row, col, 'hint');
            }, index * 100);
        });
    }
}
