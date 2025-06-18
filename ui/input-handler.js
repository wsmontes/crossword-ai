class InputHandler {
    constructor(engine) {
        this.engine = engine;
        this.wordInput = document.getElementById('word-input');
        this.submitButton = document.getElementById('submit-word-btn');
        this.currentWord = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Word input events
        this.wordInput.addEventListener('input', (e) => {
            this.handleInput(e.target.value);
        });

        this.wordInput.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        this.wordInput.addEventListener('paste', (e) => {
            this.handlePaste(e);
        });

        // Submit button
        this.submitButton.addEventListener('click', () => {
            this.submitCurrentWord();
        });

        // Listen for word selection events
        document.addEventListener('clueSelected', (e) => {
            this.setCurrentWord(e.detail.number, e.detail.direction);
        });

        document.addEventListener('wordSelect', (e) => {
            this.setCurrentWord(e.detail.number, e.detail.direction);
        });
    }

    setCurrentWord(number, direction) {
        this.currentWord = { number, direction };
        
        // Enable input
        this.wordInput.disabled = false;
        this.submitButton.disabled = false;
        
        // Load current answer
        const currentAnswer = this.engine.getCurrentAnswer(number, direction);
        this.wordInput.value = currentAnswer;
        
        // Set max length
        const correctAnswer = this.engine.getAnswer(number, direction);
        this.wordInput.maxLength = correctAnswer.length;
        
        // Focus input
        this.wordInput.focus();
        
        // Position cursor at end
        this.wordInput.setSelectionRange(currentAnswer.length, currentAnswer.length);
    }

    clearCurrentWord() {
        this.currentWord = null;
        this.wordInput.disabled = true;
        this.submitButton.disabled = true;
        this.wordInput.value = '';
        this.wordInput.maxLength = '';
    }

    handleInput(value) {
        if (!this.currentWord) return;

        // Convert to uppercase and remove invalid characters
        const cleanValue = value.toUpperCase().replace(/[^A-Z]/g, '');
        
        // Update input if cleaned
        if (cleanValue !== value) {
            this.wordInput.value = cleanValue;
        }

        // Update engine
        this.engine.setUserAnswer(this.currentWord.number, this.currentWord.direction, cleanValue);
        
        // Update grid display
        this.updateGridDisplay();
        
        // Auto-submit if word is complete and auto-check is enabled
        if (this.shouldAutoSubmit(cleanValue)) {
            setTimeout(() => this.submitCurrentWord(), 500);
        }
        
        // Dispatch input event for other components
        document.dispatchEvent(new CustomEvent('wordInputChange', {
            detail: {
                number: this.currentWord.number,
                direction: this.currentWord.direction,
                value: cleanValue
            }
        }));
    }

    handleKeyDown(event) {
        switch (event.key) {
            case 'Enter':
                event.preventDefault();
                this.submitCurrentWord();
                break;
                
            case 'Tab':
                if (!event.shiftKey) {
                    event.preventDefault();
                    this.selectNextWord();
                } else {
                    event.preventDefault();
                    this.selectPreviousWord();
                }
                break;
                
            case 'Escape':
                event.preventDefault();
                this.clearInput();
                break;
                
            case 'ArrowUp':
            case 'ArrowDown':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.toggleDirection();
                }
                break;
        }
    }

    handlePaste(event) {
        event.preventDefault();
        
        const pasteData = event.clipboardData.getData('text');
        const cleanData = pasteData.toUpperCase().replace(/[^A-Z]/g, '');
        
        if (this.currentWord) {
            const maxLength = this.engine.getAnswer(this.currentWord.number, this.currentWord.direction).length;
            const truncatedData = cleanData.substring(0, maxLength);
            
            this.wordInput.value = truncatedData;
            this.handleInput(truncatedData);
        }
    }

    submitCurrentWord() {
        if (!this.currentWord) return;

        const userAnswer = this.wordInput.value.toUpperCase();
        const correctAnswer = this.engine.getAnswer(this.currentWord.number, this.currentWord.direction);
        
        // Validate length
        if (userAnswer.length !== correctAnswer.length) {
            this.showInputFeedback(`Answer must be ${correctAnswer.length} letters long`, 'warning');
            return;
        }

        // Update engine
        this.engine.setUserAnswer(this.currentWord.number, this.currentWord.direction, userAnswer);
        
        // Check answer
        const isCorrect = this.engine.checkAnswer(this.currentWord.number, this.currentWord.direction);
        
        if (isCorrect) {
            this.handleCorrectAnswer();
        } else {
            this.handleIncorrectAnswer();
        }
        
        // Dispatch submission event
        document.dispatchEvent(new CustomEvent('wordSubmitted', {
            detail: {
                number: this.currentWord.number,
                direction: this.currentWord.direction,
                answer: userAnswer,
                correct: isCorrect
            }
        }));
    }

    handleCorrectAnswer() {
        this.showInputFeedback('Correct!', 'success');
        
        // Add visual feedback
        this.wordInput.classList.add('correct-flash');
        setTimeout(() => this.wordInput.classList.remove('correct-flash'), 500);
        
        // Move to next word after a short delay
        setTimeout(() => {
            this.selectNextWord();
        }, 1000);
    }

    handleIncorrectAnswer() {
        this.showInputFeedback('Try again!', 'error');
        
        // Add visual feedback
        this.wordInput.classList.add('incorrect-flash');
        setTimeout(() => this.wordInput.classList.remove('incorrect-flash'), 500);
        
        // Select all text for easy replacement
        this.wordInput.select();
    }

    updateGridDisplay() {
        if (!this.currentWord) return;
        
        const cells = this.engine.getWordCells(this.currentWord.number, this.currentWord.direction);
        const userAnswer = this.engine.getCurrentAnswer(this.currentWord.number, this.currentWord.direction);
        
        cells.forEach(({ row, col }, index) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                const letter = userAnswer[index] || '';
                const numberSpan = cell.querySelector('.cell-number');
                
                cell.textContent = letter;
                if (numberSpan) {
                    cell.appendChild(numberSpan);
                }
                
                // Add typing animation
                if (letter && index === userAnswer.length - 1) {
                    cell.classList.add('animate');
                    setTimeout(() => cell.classList.remove('animate'), 200);
                }
            }
        });
    }

    selectNextWord() {
        const allClues = this.getAllCluesInOrder();
        if (!this.currentWord || allClues.length === 0) return;
        
        const currentIndex = allClues.findIndex(clue => 
            clue.number === this.currentWord.number && clue.direction === this.currentWord.direction
        );
        
        const nextIndex = (currentIndex + 1) % allClues.length;
        const nextClue = allClues[nextIndex];
        
        this.selectWord(nextClue.number, nextClue.direction);
    }

    selectPreviousWord() {
        const allClues = this.getAllCluesInOrder();
        if (!this.currentWord || allClues.length === 0) return;
        
        const currentIndex = allClues.findIndex(clue => 
            clue.number === this.currentWord.number && clue.direction === this.currentWord.direction
        );
        
        const prevIndex = currentIndex === 0 ? allClues.length - 1 : currentIndex - 1;
        const prevClue = allClues[prevIndex];
        
        this.selectWord(prevClue.number, prevClue.direction);
    }

    selectWord(number, direction) {
        // Dispatch selection event
        document.dispatchEvent(new CustomEvent('clueSelected', {
            detail: { number, direction }
        }));
    }

    toggleDirection() {
        if (!this.currentWord) return;
        
        const { number } = this.currentWord;
        const newDirection = this.currentWord.direction === 'across' ? 'down' : 'across';
        
        // Check if word exists in the other direction
        const clueExists = this.engine.getClue(number, newDirection) !== '';
        
        if (clueExists) {
            this.selectWord(number, newDirection);
        }
    }

    getAllCluesInOrder() {
        const acrossClues = this.engine.clues.across.map(clue => ({
            number: clue.number,
            direction: 'across'
        }));
        
        const downClues = this.engine.clues.down.map(clue => ({
            number: clue.number,
            direction: 'down'
        }));
        
        return [...acrossClues, ...downClues].sort((a, b) => a.number - b.number);
    }

    shouldAutoSubmit(value) {
        if (!this.currentWord) return false;
        
        const correctAnswer = this.engine.getAnswer(this.currentWord.number, this.currentWord.direction);
        const autoCheck = document.getElementById('auto-check').checked;
        
        return autoCheck && value.length === correctAnswer.length;
    }

    clearInput() {
        this.wordInput.value = '';
        if (this.currentWord) {
            this.engine.setUserAnswer(this.currentWord.number, this.currentWord.direction, '');
            this.updateGridDisplay();
        }
    }

    showInputFeedback(message, type) {
        // Create or update feedback element
        let feedback = document.getElementById('input-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'input-feedback';
            feedback.className = 'input-feedback';
            this.wordInput.parentNode.appendChild(feedback);
        }
        
        feedback.textContent = message;
        feedback.className = `input-feedback ${type}`;
        feedback.style.opacity = '1';
        
        // Auto-hide after delay
        setTimeout(() => {
            feedback.style.opacity = '0';
        }, 2000);
    }

    // Accessibility helpers
    announceProgress() {
        if (!this.currentWord) return;
        
        const currentAnswer = this.wordInput.value;
        const targetLength = this.engine.getAnswer(this.currentWord.number, this.currentWord.direction).length;
        const progress = `${currentAnswer.length} of ${targetLength} letters entered`;
        
        // Use aria-live region
        let liveRegion = document.getElementById('input-progress');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'input-progress';
            liveRegion.className = 'sr-only';
            liveRegion.setAttribute('aria-live', 'polite');
            document.body.appendChild(liveRegion);
        }
        
        liveRegion.textContent = progress;
    }

    // Validation helpers
    validateInput(value) {
        // Only allow letters
        return /^[A-Z]*$/.test(value);
    }

    // Auto-complete suggestions (if enabled)
    getSuggestions(partialAnswer) {
        // This could be enhanced with a dictionary or AI suggestions
        return [];
    }
}
