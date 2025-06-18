class ProgressTracker {
    constructor(engine) {
        this.engine = engine;
        this.progressFill = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');
        this.wordsCompleted = document.getElementById('words-completed');
        this.wordsTotal = document.getElementById('words-total');
        this.hintsUsed = document.getElementById('hints-used');
        
        this.startTime = null;
        this.completedWords = new Set();
        this.hintCount = 0;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for word completion events
        document.addEventListener('wordSubmitted', (e) => {
            if (e.detail.correct) {
                this.markWordCompleted(e.detail.number, e.detail.direction);
            } else {
                this.markWordIncomplete(e.detail.number, e.detail.direction);
            }
            this.update();
        });

        // Listen for hint usage
        document.addEventListener('hintUsed', () => {
            this.incrementHints();
        });

        // Listen for puzzle start
        document.addEventListener('puzzleStarted', () => {
            this.reset();
        });
    }

    reset() {
        this.startTime = Date.now();
        this.completedWords.clear();
        this.hintCount = 0;
        this.update();
    }

    update() {
        const progress = this.calculateProgress();
        this.updateProgressBar(progress.percentage);
        this.updateStats(progress);
        
        // Check for completion
        if (progress.percentage === 100) {
            this.handlePuzzleCompletion();
        }
    }

    calculateProgress() {
        const totalWords = this.engine.clues.across.length + this.engine.clues.down.length;
        const completedCount = this.getCompletedWordsCount();
        const percentage = totalWords > 0 ? Math.round((completedCount / totalWords) * 100) : 0;
        
        return {
            completed: completedCount,
            total: totalWords,
            percentage: percentage
        };
    }

    getCompletedWordsCount() {
        let count = 0;
        
        [...this.engine.clues.across, ...this.engine.clues.down].forEach(clue => {
            const direction = this.engine.clues.across.includes(clue) ? 'across' : 'down';
            if (this.engine.checkAnswer(clue.number, direction)) {
                count++;
            }
        });
        
        return count;
    }

    updateProgressBar(percentage) {
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = `${percentage}%`;
        
        // Add visual effects based on progress
        this.progressFill.classList.remove('low', 'medium', 'high', 'complete');
        
        if (percentage === 100) {
            this.progressFill.classList.add('complete');
        } else if (percentage >= 75) {
            this.progressFill.classList.add('high');
        } else if (percentage >= 50) {
            this.progressFill.classList.add('medium');
        } else {
            this.progressFill.classList.add('low');
        }
    }

    updateStats(progress) {
        this.wordsCompleted.textContent = progress.completed;
        this.wordsTotal.textContent = progress.total;
        this.hintsUsed.textContent = this.hintCount;
    }

    markWordCompleted(number, direction) {
        const key = `${number}-${direction}`;
        this.completedWords.add(key);
        
        // Add celebration animation
        this.animateProgress();
    }

    markWordIncomplete(number, direction) {
        const key = `${number}-${direction}`;
        this.completedWords.delete(key);
    }

    incrementHints() {
        this.hintCount++;
        this.hintsUsed.textContent = this.hintCount;
        
        // Animate hint counter
        this.hintsUsed.classList.add('pulse');
        setTimeout(() => this.hintsUsed.classList.remove('pulse'), 500);
    }

    animateProgress() {
        // Animate progress bar
        this.progressFill.classList.add('pulse');
        setTimeout(() => this.progressFill.classList.remove('pulse'), 500);
        
        // Animate completed words counter
        this.wordsCompleted.classList.add('bounce');
        setTimeout(() => this.wordsCompleted.classList.remove('bounce'), 500);
    }

    handlePuzzleCompletion() {
        const completionTime = this.getCompletionTime();
        const stats = this.getCompletionStats();
        
        // Save completion data
        this.saveCompletionStats(stats);
        
        // Show completion celebration
        this.showCompletionCelebration();
        
        // Dispatch completion event
        document.dispatchEvent(new CustomEvent('puzzleCompleted', {
            detail: stats
        }));
    }

    getCompletionTime() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    getCompletionStats() {
        const completionTime = this.getCompletionTime();
        const minutes = Math.floor(completionTime / 60);
        const seconds = completionTime % 60;
        
        return {
            completionTime: completionTime,
            formattedTime: `${minutes}:${seconds.toString().padStart(2, '0')}`,
            hintsUsed: this.hintCount,
            totalWords: this.engine.clues.across.length + this.engine.clues.down.length,
            difficulty: this.getCurrentDifficulty(),
            gridSize: this.getCurrentGridSize()
        };
    }

    getCurrentDifficulty() {
        const difficultySelect = document.getElementById('difficulty-select');
        return difficultySelect ? difficultySelect.value : 'medium';
    }

    getCurrentGridSize() {
        const gridSizeSelect = document.getElementById('grid-size-select');
        return gridSizeSelect ? gridSizeSelect.value : 'medium';
    }

    saveCompletionStats(stats) {
        try {
            const storage = new SecureStorage();
            const currentStats = storage.getStats();
            
            // Update overall stats
            currentStats.puzzlesCompleted++;
            currentStats.totalHintsUsed += stats.hintsUsed;
            
            // Update best time
            if (!currentStats.bestTime || stats.completionTime < currentStats.bestTime) {
                currentStats.bestTime = stats.completionTime;
            }
            
            // Update difficulty-specific stats
            const difficulty = stats.difficulty;
            if (currentStats.difficulty[difficulty]) {
                currentStats.difficulty[difficulty].completed++;
                
                if (!currentStats.difficulty[difficulty].bestTime || 
                    stats.completionTime < currentStats.difficulty[difficulty].bestTime) {
                    currentStats.difficulty[difficulty].bestTime = stats.completionTime;
                }
            }
            
            // Calculate average completion time
            currentStats.averageCompletionTime = Math.round(
                (currentStats.averageCompletionTime * (currentStats.puzzlesCompleted - 1) + stats.completionTime) / 
                currentStats.puzzlesCompleted
            );
            
            storage.setStats(currentStats);
        } catch (error) {
            console.warn('Failed to save completion stats:', error);
        }
    }

    showCompletionCelebration() {
        // Add celebration effects to progress bar
        this.progressFill.classList.add('celebration');
        
        // Create confetti effect (simple version)
        this.createConfettiEffect();
        
        // Clean up after animation
        setTimeout(() => {
            this.progressFill.classList.remove('celebration');
        }, 2000);
    }

    createConfettiEffect() {
        // Simple confetti animation
        const colors = ['#6366f1', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444'];
        
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 2 + 's';
                
                document.body.appendChild(confetti);
                
                // Remove after animation
                setTimeout(() => {
                    if (confetti.parentNode) {
                        confetti.parentNode.removeChild(confetti);
                    }
                }, 3000);
            }, i * 100);
        }
    }

    // Time tracking
    getElapsedTime() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    getFormattedElapsedTime() {
        const elapsed = this.getElapsedTime();
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Progress analysis
    getProgressAnalysis() {
        const progress = this.calculateProgress();
        const elapsedTime = this.getElapsedTime();
        const rate = elapsedTime > 0 ? progress.completed / (elapsedTime / 60) : 0; // words per minute
        
        const estimatedTimeRemaining = rate > 0 ? 
            Math.ceil((progress.total - progress.completed) / rate) : 0;
        
        return {
            wordsPerMinute: Math.round(rate * 10) / 10,
            estimatedMinutesRemaining: estimatedTimeRemaining,
            efficiency: this.calculateEfficiency()
        };
    }

    calculateEfficiency() {
        const progress = this.calculateProgress();
        const hintsPerWord = progress.completed > 0 ? this.hintCount / progress.completed : 0;
        
        // Lower hints per word = higher efficiency
        return Math.max(0, 100 - (hintsPerWord * 20));
    }

    // Achievement tracking
    checkAchievements(stats) {
        const achievements = [];
        
        // Speed achievements
        if (stats.completionTime < 300) { // 5 minutes
            achievements.push('Speed Demon');
        }
        
        // No hints achievement
        if (stats.hintsUsed === 0) {
            achievements.push('No Help Needed');
        }
        
        // Perfect score
        if (stats.hintsUsed === 0 && stats.completionTime < 600) {
            achievements.push('Perfect Solver');
        }
        
        return achievements;
    }

    // Export progress data
    exportProgress() {
        const progress = this.calculateProgress();
        const analysis = this.getProgressAnalysis();
        const stats = this.getCompletionStats();
        
        return {
            progress,
            analysis,
            stats,
            timestamp: Date.now()
        };
    }
}
