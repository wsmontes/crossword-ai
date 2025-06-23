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

        // Dynamic cell sizing based on grid dimensions and viewport
        const { cellSize, gridMaxSize } = this.calculateOptimalGridSize(rows, cols);
        
        // Set CSS grid dimensions with responsive sizing
        this.gridElement.style.gridTemplateColumns = `repeat(${cols}, ${cellSize})`;
        this.gridElement.style.gridTemplateRows = `repeat(${rows}, ${cellSize})`;
        this.gridElement.style.maxWidth = gridMaxSize;
        this.gridElement.style.maxHeight = gridMaxSize;
        
        // Center the grid and ensure it fits in the container
        this.gridElement.style.justifySelf = 'center';
        this.gridElement.style.alignSelf = 'center';
        this.gridElement.style.aspectRatio = `${cols} / ${rows}`;

        // Add responsive class for styling
        this.gridElement.className = `crossword-grid size-${this.getGridSizeClass(rows, cols)}`;

        // Clear existing grid
        this.gridElement.innerHTML = '';

        // Create cells
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = this.createCell(row, col);
                this.gridElement.appendChild(cell);
            }
        }

        // Add resize observer for dynamic adjustment
        this.setupResizeObserver();
    }

    calculateOptimalGridSize(rows, cols) {
        const container = this.gridElement.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        // Get better container dimensions considering the overall layout
        const gameBoard = document.querySelector('.game-board');
        const gameBoardRect = gameBoard ? gameBoard.getBoundingClientRect() : containerRect;
        
        // Calculate available space more accurately
        const availableWidth = Math.min(containerRect.width, gameBoardRect.width * 0.6) - 60; // Leave more padding and account for sidebar
        const availableHeight = Math.min(containerRect.height, gameBoardRect.height) - 120; // Account for word input panel
        
        // Calculate cell size based on available space and grid dimensions
        const maxCellWidth = Math.floor(availableWidth / cols);
        const maxCellHeight = Math.floor(availableHeight / rows);
        const maxCellSize = Math.min(maxCellWidth, maxCellHeight);
        
        // Set reasonable min/max bounds with better mobile support
        const minCellSize = window.innerWidth < 768 ? 24 : 28;
        const maxAllowedCellSize = window.innerWidth < 768 ? 36 : 45;
        
        const cellSize = Math.max(minCellSize, Math.min(maxCellSize, maxAllowedCellSize));
        
        // Calculate total grid size
        const totalGridWidth = cellSize * cols;
        const totalGridHeight = cellSize * rows;
        const gridMaxSize = `min(${totalGridWidth}px, ${availableWidth}px)`;
        
        return {
            cellSize: `${cellSize}px`,
            gridMaxSize
        };
    }

    getGridSizeClass(rows, cols) {
        const totalCells = rows * cols;
        if (totalCells <= 100) return 'small';
        if (totalCells <= 225) return 'medium';
        return 'large';
    }

    setupResizeObserver() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        this.resizeObserver = new ResizeObserver(() => {
            // Debounce resize events
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.updateGridSize();
            }, 250);
        });

        this.resizeObserver.observe(this.gridElement.parentElement);
    }

    updateGridSize() {
        if (!this.engine.grid || this.engine.grid.length === 0) return;

        const grid = this.engine.grid;
        const rows = grid.length;
        const cols = grid[0] ? grid[0].length : 0;

        const { cellSize, gridMaxSize } = this.calculateOptimalGridSize(rows, cols);
        
        this.gridElement.style.gridTemplateColumns = `repeat(${cols}, ${cellSize})`;
        this.gridElement.style.gridTemplateRows = `repeat(${rows}, ${cellSize})`;
        this.gridElement.style.maxWidth = gridMaxSize;
        this.gridElement.style.maxHeight = gridMaxSize;
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
        // Get current direction from the UI state or from current word display
        const currentDirectionElement = document.getElementById('current-direction');
        if (currentDirectionElement) {
            const text = currentDirectionElement.textContent.toLowerCase();
            if (text.includes('across') || text.includes('horizontal')) {
                return 'across';
            } else if (text.includes('down') || text.includes('vertical')) {
                return 'down';
            }
        }
        
        // Fallback: check if there's a selected word in the UI
        if (window.app && window.app.ui && window.app.ui.currentWord) {
            return window.app.ui.currentWord.direction;
        }
        
        return 'across'; // Default to across
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
        // Don't allow selection of blocked cells
        if (this.engine.isCellBlocked(row, col)) {
            return;
        }

        // Find words that intersect at this cell
        const acrossWord = this.engine.findWordAt(row, col, 'across');
        const downWord = this.engine.findWordAt(row, col, 'down');
        
        let targetWord = null;
        let targetDirection = null;
        
        // Determine which word to select
        if (acrossWord && downWord) {
            // Both words exist - check if we're clicking on the same cell as currently selected
            const isCurrentCell = this.selectedCell && 
                                  this.selectedCell.row === row && 
                                  this.selectedCell.col === col;
            
            if (isCurrentCell) {
                // Toggle direction if clicking the same cell
                const currentDirection = this.getCurrentDirection();
                targetDirection = currentDirection === 'across' ? 'down' : 'across';
                targetWord = targetDirection === 'across' ? acrossWord : downWord;
            } else {
                // New cell - prefer across by default
                targetDirection = 'across';
                targetWord = acrossWord;
            }
        } else if (acrossWord) {
            targetDirection = 'across';
            targetWord = acrossWord;
        } else if (downWord) {
            targetDirection = 'down';
            targetWord = downWord;
        }
        
        if (targetWord && targetDirection) {
            // Store selected cell
            this.selectedCell = { row, col };
            
            // Trigger word selection event
            const event = new CustomEvent('wordSelect', {
                detail: {
                    number: targetWord.number,
                    direction: targetDirection,
                    row,
                    col
                }
            });
            document.dispatchEvent(event);
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
