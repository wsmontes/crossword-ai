class CrosswordUI {
    constructor(engine, llmClient) {
        this.engine = engine;
        this.llmClient = llmClient;
        this.currentWord = null;
        this.selectedCell = null;
        
        // Initialize UI components
        this.gridManager = new GridManager(this.engine);
        this.clueManager = new ClueManager(this.engine);
        this.inputHandler = new InputHandler(this.engine);
        this.progressTracker = new ProgressTracker(this.engine);
        this.settingsManager = new SettingsManager();
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Grid click events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                this.handleCellClick(e.target);
            }
        });

        // Clue click events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('clue-item') || e.target.closest('.clue-item')) {
                const clueItem = e.target.classList.contains('clue-item') ? e.target : e.target.closest('.clue-item');
                this.handleClueClick(clueItem);
            }
        });

        // Word input events
        const wordInput = document.getElementById('word-input');
        wordInput.addEventListener('input', (e) => {
            this.handleWordInput(e.target.value);
        });

        wordInput.addEventListener('keydown', (e) => {
            this.handleWordInputKeydown(e);
        });

        // Submit word button
        document.getElementById('submit-word-btn').addEventListener('click', () => {
            this.submitCurrentWord();
        });

        // Settings changes
        document.getElementById('auto-check').addEventListener('change', (e) => {
            this.settingsManager.setAutoCheck(e.target.checked);
        });

        document.getElementById('show-mistakes').addEventListener('change', (e) => {
            this.settingsManager.setShowMistakes(e.target.checked);
        });
    }

    renderGrid() {
        this.gridManager.render();
        this.updateProgress();
    }

    renderClues() {
        this.clueManager.render();
    }

    handleCellClick(cellElement) {
        const row = parseInt(cellElement.dataset.row);
        const col = parseInt(cellElement.dataset.col);
        
        // Don't allow clicking on blocked cells
        if (this.engine.getCellValue(row, col) === null) {
            return;
        }

        // Find words that intersect at this cell
        const acrossWord = this.engine.findWordAt(row, col, 'across');
        const downWord = this.engine.findWordAt(row, col, 'down');
        
        let targetWord = null;
        
        // If we already have a selected word, and this cell is part of it, keep it selected
        if (this.currentWord) {
            const currentWordCells = this.engine.getWordCells(this.currentWord.number, this.currentWord.direction);
            const isInCurrentWord = currentWordCells.some(cell => cell.row === row && cell.col === col);
            
            if (isInCurrentWord) {
                targetWord = this.currentWord;
            }
        }
        
        // If not part of current word, choose the best word to select
        if (!targetWord) {
            if (acrossWord && downWord) {
                // If both words exist, choose the one that's not currently selected
                if (this.currentWord && 
                    this.currentWord.number === acrossWord.number && 
                    this.currentWord.direction === 'across') {
                    targetWord = { number: downWord.number, direction: 'down' };
                } else {
                    targetWord = { number: acrossWord.number, direction: 'across' };
                }
            } else if (acrossWord) {
                targetWord = { number: acrossWord.number, direction: 'across' };
            } else if (downWord) {
                targetWord = { number: downWord.number, direction: 'down' };
            }
        }
        
        if (targetWord) {
            this.selectWord(targetWord.number, targetWord.direction);
            this.selectedCell = { row, col };
        }
    }

    handleClueClick(clueElement) {
        const number = parseInt(clueElement.dataset.number);
        const direction = clueElement.dataset.direction;
        
        this.selectWord(number, direction);
    }

    selectWord(number, direction) {
        // Clear previous selection
        this.clearHighlights();
        
        // Set current word
        this.currentWord = { number, direction };
        
        // Highlight word cells
        this.highlightWord(number, direction);
        
        // Update current word display
        this.updateCurrentWordDisplay(number, direction);
        
        // Update clue highlighting
        this.highlightActiveClue(number, direction);
        
        // Focus on input
        const wordInput = document.getElementById('word-input');
        wordInput.disabled = false;
        wordInput.focus();
        
        // Enable submit button
        document.getElementById('submit-word-btn').disabled = false;
    }

    highlightWord(number, direction) {
        const cells = this.engine.getWordCells(number, direction);
        cells.forEach(({ row, col }) => {
            const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cellElement) {
                cellElement.classList.add('highlighted');
            }
        });
    }

    highlightActiveClue(number, direction) {
        // Remove previous active clue
        document.querySelectorAll('.clue-item.active').forEach(el => {
            el.classList.remove('active');
        });
        
        // Add active to current clue
        const clueElement = document.querySelector(`[data-number="${number}"][data-direction="${direction}"]`);
        if (clueElement) {
            clueElement.classList.add('active');
            clueElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    updateCurrentWordDisplay(number, direction) {
        document.getElementById('current-word-number').textContent = number;
        document.getElementById('current-word-direction').textContent = direction.toUpperCase();
        document.getElementById('current-word-clue').textContent = this.engine.getClue(number, direction);
        
        // Set current answer in input
        const currentAnswer = this.engine.getCurrentAnswer(number, direction);
        document.getElementById('word-input').value = currentAnswer;
    }

    handleWordInput(value) {
        if (!this.currentWord) return;
        
        const { number, direction } = this.currentWord;
        const answer = value.toUpperCase();
        
        // Update engine with current answer
        this.engine.setUserAnswer(number, direction, answer);
        
        // Update grid display
        this.updateWordInGrid(number, direction, answer);
        
        // Auto-check if enabled
        if (this.settingsManager.getAutoCheck()) {
            const isComplete = answer.length === this.engine.getAnswer(number, direction).length;
            if (isComplete) {
                this.checkCurrentWord();
            }
        }
        
        // Update progress
        this.updateProgress();
    }

    handleWordInputKeydown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.submitCurrentWord();
        } else if (event.key === 'Tab' && !event.shiftKey) {
            event.preventDefault();
            this.selectNextWord();
        } else if (event.key === 'Tab' && event.shiftKey) {
            event.preventDefault();
            this.selectPreviousWord();
        }
    }

    updateWordInGrid(number, direction, answer) {
        const cells = this.engine.getWordCells(number, direction);
        const letters = answer.split('');
        
        cells.forEach(({ row, col }, index) => {
            const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cellElement) {
                const letter = letters[index] || '';
                cellElement.textContent = letter;
                
                // Add animation
                if (letter) {
                    cellElement.classList.add('animate');
                    setTimeout(() => cellElement.classList.remove('animate'), 200);
                }
            }
        });
    }

    submitCurrentWord() {
        if (!this.currentWord) return;
        
        const { number, direction } = this.currentWord;
        const userAnswer = document.getElementById('word-input').value.toUpperCase();
        const correctAnswer = this.engine.getAnswer(number, direction);
        
        if (userAnswer.length !== correctAnswer.length) {
            this.showMessage(`Answer must be ${correctAnswer.length} letters long.`, 'warning');
            return;
        }
        
        // Update engine
        this.engine.setUserAnswer(number, direction, userAnswer);
        
        // Check answer
        const isCorrect = this.engine.checkAnswer(number, direction);
        
        if (isCorrect) {
            this.markWordAsCompleted(number, direction);
            this.showMessage('Correct!', 'success');
            this.selectNextWord();
        } else {
            if (this.settingsManager.getShowMistakes()) {
                this.highlightIncorrectWord(number, direction);
            }
            this.showMessage('Not quite right. Try again!', 'error');
        }
        
        this.updateProgress();
        this.checkPuzzleCompletion();
    }

    checkCurrentWord() {
        if (!this.currentWord) return;
        
        const { number, direction } = this.currentWord;
        const isCorrect = this.engine.checkAnswer(number, direction);
        
        if (isCorrect) {
            this.markWordAsCompleted(number, direction);
        } else if (this.settingsManager.getShowMistakes()) {
            this.highlightIncorrectWord(number, direction);
        }
    }

    markWordAsCompleted(number, direction) {
        // Mark clue as completed
        const clueElement = document.querySelector(`[data-number="${number}"][data-direction="${direction}"]`);
        if (clueElement) {
            clueElement.classList.add('completed');
        }
        
        // Mark cells as correct
        const cells = this.engine.getWordCells(number, direction);
        cells.forEach(({ row, col }) => {
            const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cellElement) {
                cellElement.classList.add('correct');
                cellElement.classList.remove('incorrect');
            }
        });
    }

    highlightIncorrectWord(number, direction) {
        const cells = this.engine.getWordCells(number, direction);
        cells.forEach(({ row, col }) => {
            const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cellElement) {
                cellElement.classList.add('incorrect');
                cellElement.classList.remove('correct');
            }
        });
    }

    selectNextWord() {
        const allClues = [...this.engine.clues.across, ...this.engine.clues.down]
            .map(clue => ({
                number: clue.number,
                direction: this.engine.clues.across.includes(clue) ? 'across' : 'down'
            }))
            .sort((a, b) => a.number - b.number);
        
        if (!this.currentWord) {
            if (allClues.length > 0) {
                this.selectWord(allClues[0].number, allClues[0].direction);
            }
            return;
        }
        
        const currentIndex = allClues.findIndex(clue => 
            clue.number === this.currentWord.number && clue.direction === this.currentWord.direction
        );
        
        const nextIndex = (currentIndex + 1) % allClues.length;
        const nextClue = allClues[nextIndex];
        
        this.selectWord(nextClue.number, nextClue.direction);
    }

    selectPreviousWord() {
        const allClues = [...this.engine.clues.across, ...this.engine.clues.down]
            .map(clue => ({
                number: clue.number,
                direction: this.engine.clues.across.includes(clue) ? 'across' : 'down'
            }))
            .sort((a, b) => a.number - b.number);
        
        if (!this.currentWord) {
            if (allClues.length > 0) {
                this.selectWord(allClues[allClues.length - 1].number, allClues[allClues.length - 1].direction);
            }
            return;
        }
        
        const currentIndex = allClues.findIndex(clue => 
            clue.number === this.currentWord.number && clue.direction === this.currentWord.direction
        );
        
        const prevIndex = currentIndex === 0 ? allClues.length - 1 : currentIndex - 1;
        const prevClue = allClues[prevIndex];
        
        this.selectWord(prevClue.number, prevClue.direction);
    }

    clearHighlights() {
        document.querySelectorAll('.cell.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
        
        document.querySelectorAll('.clue-item.active').forEach(el => {
            el.classList.remove('active');
        });
    }

    clearSelection() {
        this.clearHighlights();
        this.currentWord = null;
        this.selectedCell = null;
        
        // Clear current word display
        document.getElementById('current-word-number').textContent = '';
        document.getElementById('current-word-direction').textContent = '';
        document.getElementById('current-word-clue').textContent = 'Select a clue to begin';
        document.getElementById('word-input').value = '';
        document.getElementById('word-input').disabled = true;
        document.getElementById('submit-word-btn').disabled = true;
    }

    updateProgress() {
        this.progressTracker.update();
    }

    updateStats() {
        this.progressTracker.updateStats();
    }

    highlightResults(results) {
        results.forEach(result => {
            const cells = this.engine.getWordCells(result.number, result.direction);
            cells.forEach(({ row, col }) => {
                const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cellElement) {
                    if (result.correct) {
                        cellElement.classList.add('correct');
                        cellElement.classList.remove('incorrect');
                    } else {
                        cellElement.classList.add('incorrect');
                        cellElement.classList.remove('correct');
                    }
                }
            });
            
            // Update clue styling
            const clueElement = document.querySelector(`[data-number="${result.number}"][data-direction="${result.direction}"]`);
            if (clueElement) {
                if (result.correct) {
                    clueElement.classList.add('completed');
                } else {
                    clueElement.classList.remove('completed');
                }
            }
        });
    }

    showHint(hint) {
        this.showMessage(hint, 'info', 5000);
        
        // Highlight the current word with a pulse animation
        if (this.currentWord) {
            const cells = this.engine.getWordCells(this.currentWord.number, this.currentWord.direction);
            cells.forEach(({ row, col }) => {
                const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cellElement) {
                    cellElement.classList.add('hint');
                    setTimeout(() => cellElement.classList.remove('hint'), 1000);
                }
            });
        }
    }

    showMessage(message, type = 'info', duration = 3000) {
        const statusElement = document.getElementById('status-text');
        const originalText = statusElement.textContent;
        const originalColor = statusElement.style.color;
        
        statusElement.textContent = message;
        
        switch (type) {
            case 'success':
                statusElement.style.color = 'var(--success-color)';
                break;
            case 'error':
                statusElement.style.color = 'var(--danger-color)';
                break;
            case 'warning':
                statusElement.style.color = 'var(--warning-color)';
                break;
            case 'info':
                statusElement.style.color = 'var(--puzzle-primary)';
                break;
            default:
                statusElement.style.color = originalColor;
        }
        
        setTimeout(() => {
            statusElement.textContent = originalText;
            statusElement.style.color = originalColor;
        }, duration);
    }

    checkPuzzleCompletion() {
        const progress = this.engine.getProgress();
        if (progress.completed === progress.total && progress.total > 0) {
            // Puzzle completed!
            setTimeout(() => {
                document.dispatchEvent(new CustomEvent('puzzleCompleted'));
            }, 500);
        }
    }
}
