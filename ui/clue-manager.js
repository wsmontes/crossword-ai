class ClueManager {
    constructor(engine) {
        this.engine = engine;
        this.acrossContainer = document.getElementById('across-clues');
        this.downContainer = document.getElementById('down-clues');
    }

    render() {
        this.renderAcrossClues();
        this.renderDownClues();
    }

    renderAcrossClues() {
        this.acrossContainer.innerHTML = '';
        
        this.engine.clues.across.forEach(clue => {
            const clueElement = this.createClueElement(clue, 'across');
            this.acrossContainer.appendChild(clueElement);
        });
    }

    renderDownClues() {
        this.downContainer.innerHTML = '';
        
        this.engine.clues.down.forEach(clue => {
            const clueElement = this.createClueElement(clue, 'down');
            this.downContainer.appendChild(clueElement);
        });
    }

    createClueElement(clue, direction) {
        const clueItem = document.createElement('div');
        clueItem.className = 'clue-item';
        clueItem.dataset.number = clue.number;
        clueItem.dataset.direction = direction;

        // Create clue number
        const clueNumber = document.createElement('span');
        clueNumber.className = 'clue-number';
        clueNumber.textContent = clue.number;

        // Create clue text
        const clueText = document.createElement('span');
        clueText.className = 'clue-text';
        clueText.textContent = clue.clue;

        // Create answer length indicator
        const answerLength = document.createElement('span');
        answerLength.className = 'answer-length';
        answerLength.textContent = `(${clue.answer.length})`;

        clueItem.appendChild(clueNumber);
        clueItem.appendChild(clueText);
        clueItem.appendChild(answerLength);

        // Add click handler
        clueItem.addEventListener('click', () => {
            this.selectClue(clue.number, direction);
        });

        // Add keyboard navigation
        clueItem.setAttribute('tabindex', '0');
        clueItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.selectClue(clue.number, direction);
            }
        });

        return clueItem;
    }

    selectClue(number, direction) {
        // Clear previous selection
        this.clearSelection();

        // Mark this clue as active
        const clueElement = document.querySelector(`[data-number="${number}"][data-direction="${direction}"]`);
        if (clueElement) {
            clueElement.classList.add('active');
            
            // Scroll into view if needed
            clueElement.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }

        // Dispatch event for UI coordination
        const event = new CustomEvent('clueSelected', {
            detail: { number, direction }
        });
        document.dispatchEvent(event);
    }

    clearSelection() {
        document.querySelectorAll('.clue-item.active').forEach(item => {
            item.classList.remove('active');
        });
    }

    markAsCompleted(number, direction) {
        const clueElement = document.querySelector(`[data-number="${number}"][data-direction="${direction}"]`);
        if (clueElement) {
            clueElement.classList.add('completed');
            
            // Add completion animation
            clueElement.style.animation = 'none';
            setTimeout(() => {
                clueElement.style.animation = 'pulse 0.5s ease-in-out';
            }, 10);
        }
    }

    markAsIncomplete(number, direction) {
        const clueElement = document.querySelector(`[data-number="${number}"][data-direction="${direction}"]`);
        if (clueElement) {
            clueElement.classList.remove('completed');
        }
    }

    updateProgress() {
        // Update completion status for all clues
        [...this.engine.clues.across, ...this.engine.clues.down].forEach(clue => {
            const direction = this.engine.clues.across.includes(clue) ? 'across' : 'down';
            const isCorrect = this.engine.checkAnswer(clue.number, direction);
            
            if (isCorrect) {
                this.markAsCompleted(clue.number, direction);
            } else {
                this.markAsIncomplete(clue.number, direction);
            }
        });
    }

    highlightClue(number, direction, type = 'hint') {
        const clueElement = document.querySelector(`[data-number="${number}"][data-direction="${direction}"]`);
        if (clueElement) {
            clueElement.classList.add(type);
            setTimeout(() => {
                clueElement.classList.remove(type);
            }, 2000);
        }
    }

    getClueElement(number, direction) {
        return document.querySelector(`[data-number="${number}"][data-direction="${direction}"]`);
    }

    // Search and filter functionality
    filterClues(searchTerm) {
        const allClues = document.querySelectorAll('.clue-item');
        
        allClues.forEach(clue => {
            const clueText = clue.querySelector('.clue-text').textContent.toLowerCase();
            const matchesSearch = clueText.includes(searchTerm.toLowerCase());
            
            if (searchTerm === '' || matchesSearch) {
                clue.style.display = '';
            } else {
                clue.style.display = 'none';
            }
        });
    }

    // Accessibility helpers
    announceClue(number, direction) {
        const clue = this.engine.getClue(number, direction);
        const announcement = `${number} ${direction}: ${clue}`;
        
        // Create or update aria-live region
        let liveRegion = document.getElementById('clue-announcement');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'clue-announcement';
            liveRegion.className = 'sr-only';
            liveRegion.setAttribute('aria-live', 'polite');
            document.body.appendChild(liveRegion);
        }
        
        liveRegion.textContent = announcement;
    }

    // Navigation helpers
    getNextClue(currentNumber, currentDirection) {
        const allClues = this.getAllCluesInOrder();
        const currentIndex = allClues.findIndex(clue => 
            clue.number === currentNumber && clue.direction === currentDirection
        );
        
        if (currentIndex !== -1 && currentIndex < allClues.length - 1) {
            return allClues[currentIndex + 1];
        }
        
        return allClues[0]; // Wrap to first
    }

    getPreviousClue(currentNumber, currentDirection) {
        const allClues = this.getAllCluesInOrder();
        const currentIndex = allClues.findIndex(clue => 
            clue.number === currentNumber && clue.direction === currentDirection
        );
        
        if (currentIndex > 0) {
            return allClues[currentIndex - 1];
        }
        
        return allClues[allClues.length - 1]; // Wrap to last
    }

    getAllCluesInOrder() {
        const acrossClues = this.engine.clues.across.map(clue => ({
            ...clue,
            direction: 'across'
        }));
        
        const downClues = this.engine.clues.down.map(clue => ({
            ...clue,
            direction: 'down'
        }));
        
        return [...acrossClues, ...downClues].sort((a, b) => a.number - b.number);
    }

    // Statistics and analysis
    getCompletionStats() {
        const totalClues = this.engine.clues.across.length + this.engine.clues.down.length;
        let completedClues = 0;
        
        [...this.engine.clues.across, ...this.engine.clues.down].forEach(clue => {
            const direction = this.engine.clues.across.includes(clue) ? 'across' : 'down';
            if (this.engine.checkAnswer(clue.number, direction)) {
                completedClues++;
            }
        });
        
        return {
            total: totalClues,
            completed: completedClues,
            percentage: Math.round((completedClues / totalClues) * 100)
        };
    }

    // Visual enhancements
    addClueHint(number, direction, hintText) {
        const clueElement = this.getClueElement(number, direction);
        if (clueElement && !clueElement.querySelector('.clue-hint')) {
            const hintElement = document.createElement('div');
            hintElement.className = 'clue-hint';
            hintElement.textContent = hintText;
            clueElement.appendChild(hintElement);
            
            // Auto-remove after a delay
            setTimeout(() => {
                if (hintElement.parentNode) {
                    hintElement.parentNode.removeChild(hintElement);
                }
            }, 10000);
        }
    }

    removeClueHints() {
        document.querySelectorAll('.clue-hint').forEach(hint => {
            hint.remove();
        });
    }
}
