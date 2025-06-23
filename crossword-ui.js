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
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Grid click events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('cell') && !e.target.classList.contains('blocked')) {
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
        if (wordInput) {
            wordInput.addEventListener('input', (e) => {
                this.handleWordInput(e.target.value);
            });

            wordInput.addEventListener('keydown', (e) => {
                this.handleWordInputKeydown(e);
            });
        }

        // Submit word button
        const submitWordBtn = document.getElementById('submit-word-btn');
        if (submitWordBtn) {
            submitWordBtn.addEventListener('click', () => {
                this.submitCurrentWord();
            });
        }

        // Auto-check setting change
        document.addEventListener('settingChanged', (e) => {
            if (e.detail.key === 'autoCheck') {
                this.autoCheckEnabled = e.detail.value;
            } else if (e.detail.key === 'showMistakes') {
                this.showMistakesEnabled = e.detail.value;
            }
        });

        // Listen for clue selection events
        document.addEventListener('clueSelected', (e) => {
            this.selectWord(e.detail.number, e.detail.direction);
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
            this.updateCursorPosition(row, col);
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
        
        // Update tab if needed
        this.updateActiveTab(direction);
        
        // Focus on input
        const wordInput = document.getElementById('word-input');
        if (wordInput) {
            wordInput.disabled = false;
            wordInput.focus();
        }
        
        // Enable submit button
        const submitBtn = document.getElementById('submit-word-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
        }

        // Update theme display in main app
        if (window.app && window.app.updateThemeDisplay) {
            window.app.updateThemeDisplay();
        }

        // Announce to screen readers
        this.announceWordSelection(number, direction);
    }

    highlightWord(number, direction) {
        const cells = this.engine.getWordCells(number, direction);
        cells.forEach(({ row, col }) => {
            const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cellElement) {
                cellElement.classList.add('active-word');
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
            
            // Ensure the clue is visible (scroll into view if needed)
            clueElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest',
                inline: 'nearest'
            });
        }
    }

    updateCurrentWordDisplay(number, direction) {
        const currentNumber = document.getElementById('current-number');
        const currentDirection = document.getElementById('current-direction');
        const currentLength = document.getElementById('current-length');
        
        if (currentNumber) currentNumber.textContent = number;
        if (currentDirection) {
            // Use translated direction
            const translatedDirection = window.i18n ? window.i18n.t(direction) : direction.toUpperCase();
            currentDirection.textContent = translatedDirection.toUpperCase();
        }
        
        const wordLength = this.engine.getAnswer(number, direction).length;
        if (currentLength) currentLength.textContent = wordLength;
        
        // Set current answer in input
        const currentAnswer = this.engine.getCurrentAnswer(number, direction);
        const wordInput = document.getElementById('word-input');
        if (wordInput) {
            wordInput.value = currentAnswer;
            wordInput.maxLength = wordLength;
        }
    }

    updateActiveTab(direction) {
        const acrossTab = document.getElementById('across-tab');
        const downTab = document.getElementById('down-tab');
        
        if (direction === 'across' && acrossTab && !acrossTab.classList.contains('active')) {
            acrossTab.click();
        } else if (direction === 'down' && downTab && !downTab.classList.contains('active')) {
            downTab.click();
        }
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
        if (this.autoCheckEnabled && answer.length === this.engine.getAnswer(number, direction).length) {
            this.checkCurrentWord();
        }
        
        this.updateProgress();
    }

    handleWordInputKeydown(event) {
        if (!this.currentWord) return;

        switch (event.key) {
            case 'Enter':
                event.preventDefault();
                this.submitCurrentWord();
                break;
            case 'Tab':
                event.preventDefault();
                if (event.shiftKey) {
                    this.selectPreviousWord();
                } else {
                    this.selectNextWord();
                }
                break;
            case 'Escape':
                event.preventDefault();
                this.clearSelection();
                break;
        }
    }

    updateWordInGrid(number, direction, answer) {
        const cells = this.engine.getWordCells(number, direction);
        
        cells.forEach(({ row, col }, index) => {
            const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cellElement) {
                const letter = index < answer.length ? answer[index] : '';
                
                // Preserve cell number
                const numberSpan = cellElement.querySelector('.cell-number');
                cellElement.textContent = letter;
                if (numberSpan) {
                    cellElement.appendChild(numberSpan);
                }
                
                // Add animation for new letters
                if (letter && !cellElement.textContent.includes(letter)) {
                    cellElement.classList.add('animate');
                    setTimeout(() => cellElement.classList.remove('animate'), 300);
                }
            }
        });
    }

    submitCurrentWord() {
        if (!this.currentWord) return;
        
        const { number, direction } = this.currentWord;
        const userAnswer = this.engine.getCurrentAnswer(number, direction);
        const correctAnswer = this.engine.getAnswer(number, direction);
        
        if (userAnswer.length !== correctAnswer.length) {
            const message = window.i18n ? window.i18n.t('pleaseComplete') : 'Please complete the word before submitting';
            this.showMessage(message, 'warning');
            return;
        }
        
        const isCorrect = this.engine.checkAnswer(number, direction);
        
        if (isCorrect) {
            this.markWordAsCompleted(number, direction);
            const correctMessage = window.i18n ? window.i18n.t('correct') : 'Correct!';
            this.showMessage(correctMessage, 'success', 2000);
            this.autoAdvanceToNextWord();
        } else {
            this.highlightIncorrectWord(number, direction);
            const incorrectMessage = window.i18n ? window.i18n.t('incorrectTryAgain') : 'Incorrect. Try again!';
            this.showMessage(incorrectMessage, 'error', 3000);
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
            return true;
        } else if (this.showMistakesEnabled) {
            this.highlightIncorrectWord(number, direction);
        }
        
        return false;
    }

    autoAdvanceToNextWord() {
        // Find next incomplete word
        const allWords = [...this.engine.clues.across, ...this.engine.clues.down]
            .map(clue => ({
                number: clue.number,
                direction: this.engine.clues.across.includes(clue) ? 'across' : 'down'
            }))
            .filter(word => !this.engine.checkAnswer(word.number, word.direction));
            
        if (allWords.length > 0) {
            const nextWord = allWords[0];
            setTimeout(() => {
                this.selectWord(nextWord.number, nextWord.direction);
            }, 1000);
        }
    }

    markWordAsCompleted(number, direction) {
        // Mark cells as correct
        const cells = this.engine.getWordCells(number, direction);
        cells.forEach(({ row, col }) => {
            const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cellElement) {
                cellElement.classList.remove('incorrect');
                cellElement.classList.add('correct');
            }
        });
        
        // Mark clue as completed
        this.clueManager.markAsCompleted(number, direction);
    }

    highlightIncorrectWord(number, direction) {
        const cells = this.engine.getWordCells(number, direction);
        cells.forEach(({ row, col }) => {
            const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cellElement) {
                cellElement.classList.remove('correct');
                cellElement.classList.add('incorrect');
                
                // Remove incorrect class after animation
                setTimeout(() => {
                    cellElement.classList.remove('incorrect');
                }, 2000);
            }
        });
    }

    selectNextWord() {
        if (!this.currentWord) {
            this.selectFirstAvailableWord();
            return;
        }
        
        const allWords = this.getAllWordsInOrder();
        const currentIndex = allWords.findIndex(word => 
            word.number === this.currentWord.number && word.direction === this.currentWord.direction
        );
        
        if (currentIndex !== -1 && currentIndex < allWords.length - 1) {
            const nextWord = allWords[currentIndex + 1];
            this.selectWord(nextWord.number, nextWord.direction);
        } else if (allWords.length > 0) {
            // Wrap to first word
            this.selectWord(allWords[0].number, allWords[0].direction);
        }
    }

    selectPreviousWord() {
        if (!this.currentWord) {
            this.selectFirstAvailableWord();
            return;
        }
        
        const allWords = this.getAllWordsInOrder();
        const currentIndex = allWords.findIndex(word => 
            word.number === this.currentWord.number && word.direction === this.currentWord.direction
        );
        
        if (currentIndex > 0) {
            const prevWord = allWords[currentIndex - 1];
            this.selectWord(prevWord.number, prevWord.direction);
        } else if (allWords.length > 0) {
            // Wrap to last word
            const lastWord = allWords[allWords.length - 1];
            this.selectWord(lastWord.number, lastWord.direction);
        }
    }

    getAllWordsInOrder() {
        const acrossWords = this.engine.clues.across.map(clue => ({
            number: clue.number,
            direction: 'across'
        }));
        
        const downWords = this.engine.clues.down.map(clue => ({
            number: clue.number,
            direction: 'down'
        }));
        
        return [...acrossWords, ...downWords].sort((a, b) => {
            if (a.number !== b.number) {
                return a.number - b.number;
            }
            return a.direction === 'across' ? -1 : 1;
        });
    }

    selectFirstAvailableWord() {
        if (this.engine.clues.across.length > 0) {
            this.selectWord(this.engine.clues.across[0].number, 'across');
        } else if (this.engine.clues.down.length > 0) {
            this.selectWord(this.engine.clues.down[0].number, 'down');
        }
    }

    clearHighlights() {
        document.querySelectorAll('.cell.active-word, .cell.selected, .cell.highlighted').forEach(cell => {
            cell.classList.remove('active-word', 'selected', 'highlighted');
        });
    }

    clearSelection() {
        this.clearHighlights();
        this.currentWord = null;
        this.selectedCell = null;
        
        // Clear current word display
        const wordInput = document.getElementById('word-input');
        if (wordInput) {
            wordInput.value = '';
            wordInput.disabled = true;
        }
        
        const submitBtn = document.getElementById('submit-word-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
        }
        
        // Clear active clue
        document.querySelectorAll('.clue-item.active').forEach(el => {
            el.classList.remove('active');
        });
    }

    updateProgress() {
        if (window.app && window.app.updateProgress) {
            window.app.updateProgress();
        }
        
        this.clueManager.updateProgress();
    }

    updateProgressDisplay() {
        this.updateProgress();
    }

    highlightResults(results) {
        // results is an array of result objects, not an object with a 'words' property
        results.forEach(wordResult => {
            const cells = this.engine.getWordCells(wordResult.number, wordResult.direction);
            cells.forEach(({ row, col }) => {
                const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cellElement) {
                    cellElement.classList.remove('correct', 'incorrect');
                    cellElement.classList.add(wordResult.correct ? 'correct' : 'incorrect');
                }
            });
            
            if (wordResult.correct) {
                this.clueManager.markAsCompleted(wordResult.number, wordResult.direction);
            }
        });
    }

    showHint(hint) {
        if (!this.currentWord) return;
        
        const cells = this.engine.getWordCells(this.currentWord.number, this.currentWord.direction);
        cells.forEach(({ row, col }) => {
            const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cellElement) {
                cellElement.classList.add('hint');
                setTimeout(() => {
                    cellElement.classList.remove('hint');
                }, 3000);
            }
        });
        
        this.clueManager.highlightClue(this.currentWord.number, this.currentWord.direction, 'hint');
    }

    showMessage(message, type = 'info', duration = 3000) {
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type, duration);
        }
    }

    checkPuzzleCompletion() {
        const totalWords = this.engine.getTotalWords();
        const completedWords = this.engine.getCompletedWords();
        
        if (totalWords > 0 && completedWords === totalWords) {
            // Dispatch puzzle completion event
            const event = new CustomEvent('puzzleCompleted', {
                detail: {
                    totalWords,
                    completedWords,
                    hintsUsed: window.app?.hintsUsed || 0,
                    timeElapsed: window.app?.startTime ? Date.now() - window.app.startTime : 0
                }
            });
            document.dispatchEvent(event);
        }
    }

    updateCursorPosition(row, col) {
        // Remove previous cursor
        document.querySelectorAll('.cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
        
        // Add cursor to new position
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cellElement) {
            cellElement.classList.add('selected');
        }
    }

    announceWordSelection(number, direction) {
        const clue = this.engine.getClue(number, direction);
        const announcement = `Selected ${number} ${direction}: ${clue}`;
        
        // Create or update aria-live region
        let liveRegion = document.getElementById('aria-live');
        if (liveRegion) {
            liveRegion.textContent = announcement;
        }
    }

    // Animation helpers
    animateCell(row, col, animationType = 'pulse') {
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cellElement) {
            cellElement.classList.add(animationType);
            setTimeout(() => {
                cellElement.classList.remove(animationType);
            }, 600);
        }
    }

    pulseWord(number, direction) {
        const cells = this.engine.getWordCells(number, direction);
        cells.forEach(({ row, col }, index) => {
            setTimeout(() => {
                this.animateCell(row, col, 'pulse');
            }, index * 100);
        });
    }

    getSelectedClue() {
        return this.currentWord;
    }
}
