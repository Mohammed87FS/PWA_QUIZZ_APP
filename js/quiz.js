// Quiz Logic for Quiz Master PWA
// Handles quiz flow, questions, scoring and game mechanics

class QuizManager {
    constructor() {
        this.currentQuiz = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = [];
        this.startTime = null;
        this.endTime = null;
        this.settings = {};
        this.isQuizActive = false;
        this.selectedAnswer = null;
        this.hasAnswered = false;
        this.autoAdvanceTimer = null;
    }

    // Initialize quiz manager
    init() {
        this.loadSettings();
        this.bindEvents();
        console.log('Quiz Manager initialized');
    }

    // Load settings from storage
    loadSettings() {
        if (window.storageManager) {
            this.settings = window.storageManager.loadSettings();
        } else {
            // Fallback if storageManager not available
            try {
                this.settings = JSON.parse(localStorage.getItem('quizSettings') || '{}');
            } catch (error) {
                this.settings = {};
            }
        }
        
        // Ensure all required settings have default values
        this.settings = {
            showExplanations: true,
            darkMode: false,
            ...this.settings
        };
        
        console.log('Quiz settings loaded:', this.settings);
    }

    // Bind event listeners
    bindEvents() {
        // Answer option clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.option') && this.isQuizActive && !this.hasAnswered) {
                this.selectAnswer(e.target.closest('.option'));
            }
        });

        // Submit answer button
        const submitBtn = document.getElementById('submitAnswer');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitAnswer());
        }

        // Next question button
        const nextBtn = document.getElementById('nextQuestion');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextQuestion());
        }

        // Restart quiz button
        const restartBtn = document.getElementById('restartQuiz');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartQuiz());
        }

        // New quiz button
        const newQuizBtn = document.getElementById('newQuiz');
        if (newQuizBtn) {
            newQuizBtn.addEventListener('click', () => this.startNewQuiz());
        }
    }

    // Start a new quiz with given questions
    startQuiz(quizData, quizName = 'Quiz') {
        try {
            this.currentQuiz = {
                name: quizName,
                questions: quizData.questions,
                startTime: new Date().toISOString()
            };

            this.questions = [...quizData.questions];
            
            // Questions are not randomized in simplified version

            // Reset quiz state
            this.currentQuestionIndex = 0;
            this.score = 0;
            this.userAnswers = [];
            this.startTime = Date.now();
            this.endTime = null;
            this.isQuizActive = true;
            this.selectedAnswer = null;
            this.hasAnswered = false;

            // Save current quiz state
            this.saveQuizState();

            // Show quiz interface
            this.showQuizInterface();
            this.displayCurrentQuestion();

            console.log('Quiz started:', quizName, 'Questions:', this.questions.length);

        } catch (error) {
            console.error('Error starting quiz:', error);
        }
    }

    // Display current question
    displayCurrentQuestion() {
        if (!this.isQuizActive || this.currentQuestionIndex >= this.questions.length) {
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        const questionText = document.getElementById('questionText');
        const optionsContainer = document.getElementById('optionsContainer');
        const currentQuestionSpan = document.getElementById('currentQuestion');
        const totalQuestionsSpan = document.getElementById('totalQuestions');
        const progressFill = document.getElementById('progressFill');

        // Update question info
        if (questionText) questionText.textContent = question.question;
        if (currentQuestionSpan) currentQuestionSpan.textContent = this.currentQuestionIndex + 1;
        if (totalQuestionsSpan) totalQuestionsSpan.textContent = this.questions.length;

        // Update progress bar
        if (progressFill) {
            const progress = (this.currentQuestionIndex / this.questions.length) * 100;
            progressFill.style.setProperty('--progress', `${progress}%`);
        }

        // Reset answer state
        this.selectedAnswer = null;
        this.hasAnswered = false;
        
        // Reset submit button
        const submitBtn = document.getElementById('submitAnswer');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Antwort bestätigen';
        }

        // Create options
        if (optionsContainer) {
            optionsContainer.innerHTML = '';
            
            const options = question.options;

            options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'option';
                optionElement.dataset.index = index;
                optionElement.dataset.originalIndex = index;
                optionElement.style.pointerEvents = 'auto'; // Re-enable interactions

                optionElement.innerHTML = `
                    <div class="option-letter">${String.fromCharCode(65 + index)}</div>
                    <div class="option-text">${option}</div>
                `;

                optionsContainer.appendChild(optionElement);
            });
        }

        // Hide explanation card and next button
        const explanationCard = document.getElementById('explanationCard');
        if (explanationCard) {
            explanationCard.classList.add('hidden');
        }
        
        const nextBtn = document.getElementById('nextQuestion');
        if (nextBtn) {
            nextBtn.style.display = 'none';
        }

        console.log('Displaying question:', this.currentQuestionIndex + 1);
    }

    // Select an answer option
    selectAnswer(optionElement) {
        if (!this.isQuizActive || this.hasAnswered) return;

        // Remove previous selection
        document.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
        });

        // Select current option
        optionElement.classList.add('selected');
        this.selectedAnswer = parseInt(optionElement.dataset.originalIndex);

        // Enable submit button
        const submitBtn = document.getElementById('submitAnswer');
        if (submitBtn) {
            submitBtn.disabled = false;
        }

        console.log('Answer selected:', this.selectedAnswer);
    }

    // Submit the current answer
    submitAnswer() {
        if (!this.isQuizActive || this.hasAnswered || this.selectedAnswer === null) {
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        const isCorrect = this.selectedAnswer === question.correct_answer;
        
        // Record answer
        this.userAnswers.push({
            questionId: question.id,
            questionText: question.question,
            selectedAnswer: this.selectedAnswer,
            correctAnswer: question.correct_answer,
            isCorrect: isCorrect,
            timeSpent: Date.now() - this.startTime
        });

        // Update score
        if (isCorrect) {
            this.score++;
        }

        this.hasAnswered = true;

        // Update score display
        const currentScore = document.getElementById('currentScore');
        if (currentScore) {
            currentScore.textContent = this.score;
        }

        // Show correct/incorrect answers
        this.highlightAnswers(question.correct_answer);

        // Show explanation if enabled and available
        if (this.settings.showExplanations && question.explanation) {
            this.showExplanation(question.explanation, isCorrect);
        }
        
        // Show next button for manual progression
        this.showNextButton();

        // Save progress
        this.saveQuizState();

        console.log('Answer submitted:', { selected: this.selectedAnswer, correct: isCorrect });
    }

    // Highlight correct and incorrect answers
    highlightAnswers(correctAnswerIndex) {
        const options = document.querySelectorAll('.option');
        
        options.forEach((option, index) => {
            const originalIndex = parseInt(option.dataset.originalIndex);
            option.classList.add('disabled');
            
            if (originalIndex === correctAnswerIndex) {
                option.classList.add('correct');
            } else if (originalIndex === this.selectedAnswer) {
                option.classList.add('incorrect');
            }
        });

        // Disable submit button
        const submitBtn = document.getElementById('submitAnswer');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Beantwortet';
        }
    }

    // Show explanation card
    showExplanation(explanation, isCorrect) {
        const explanationCard = document.getElementById('explanationCard');
        const answerResult = document.getElementById('answerResult');
        const explanationText = document.getElementById('explanationText');

        if (explanationCard && answerResult && explanationText) {
            explanationCard.classList.remove('hidden');
            explanationCard.classList.toggle('incorrect', !isCorrect);
            
            answerResult.textContent = isCorrect ? 'Richtig! ✅' : 'Falsch! ❌';
            answerResult.classList.toggle('incorrect', !isCorrect);
            
            explanationText.textContent = explanation;
        }
    }

    // Show next question button
    showNextButton() {
        const nextBtn = document.getElementById('nextQuestion');
        if (nextBtn) {
            if (this.currentQuestionIndex < this.questions.length - 1) {
                nextBtn.textContent = 'Nächste Frage';
            } else {
                nextBtn.textContent = 'Quiz beenden';
            }
            nextBtn.style.display = 'block';
        }
    }

    // Move to next question or finish quiz
    nextQuestion() {
        if (!this.isQuizActive) return;

        this.currentQuestionIndex++;

        if (this.currentQuestionIndex < this.questions.length) {
            // Show next question
            this.selectedAnswer = null;
            this.hasAnswered = false;
            this.displayCurrentQuestion();
        } else {
            // Finish quiz
            this.finishQuiz();
        }
    }

    // Finish the quiz and show results
    finishQuiz() {
        this.endTime = Date.now();
        this.isQuizActive = false;

        const totalTime = this.endTime - this.startTime;
        const percentage = Math.round((this.score / this.questions.length) * 100);

        // Update results display
        const finalScore = document.getElementById('finalScore');
        const finalTotal = document.getElementById('finalTotal');
        const scorePercentage = document.getElementById('scorePercentage');

        if (finalScore) finalScore.textContent = this.score;
        if (finalTotal) finalTotal.textContent = this.questions.length;
        if (scorePercentage) scorePercentage.textContent = `${percentage}%`;

        // Show results screen
        this.showResultsInterface();

        // Save final results
        this.saveQuizResults();

        // Clear current quiz state
        window.storageManager.clearCurrentQuiz();

        console.log('Quiz finished:', {
            score: this.score,
            total: this.questions.length,
            percentage: percentage,
            timeMs: totalTime
        });
    }

    // Restart current quiz
    restartQuiz() {
        if (this.currentQuiz) {
            this.startQuiz(this.currentQuiz, this.currentQuiz.name);
        }
    }

    // Start a completely new quiz
    startNewQuiz() {
        this.currentQuiz = null;
        this.isQuizActive = false;
        window.storageManager.clearCurrentQuiz();
        
        // Return to start state
        this.hideQuizInterface();
    }

    // Force end current quiz (for switching quizzes)
    forceEndQuiz() {
        this.isQuizActive = false;
        this.currentQuiz = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = [];
        this.selectedAnswer = null;
        this.hasAnswered = false;
        
        // Clear any pending timers
        if (this.autoAdvanceTimer) {
            clearTimeout(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
        }
        
        // Clear quiz state
        window.storageManager.clearCurrentQuiz();
        
        // Return to start interface
        this.hideQuizInterface();
        
        console.log('Quiz forcefully ended');
    }

    // Show quiz interface
    showQuizInterface() {
        const quizContainer = document.getElementById('quizContainer');
        const welcomeScreen = document.getElementById('welcomeScreen');
        const resultsContainer = document.getElementById('resultsContainer');

        if (quizContainer) quizContainer.classList.remove('hidden');
        if (welcomeScreen) welcomeScreen.classList.add('hidden');
        if (resultsContainer) resultsContainer.classList.add('hidden');
    }

    // Show results interface
    showResultsInterface() {
        const quizContainer = document.getElementById('quizContainer');
        const resultsContainer = document.getElementById('resultsContainer');
        const welcomeScreen = document.getElementById('welcomeScreen');

        if (quizContainer) quizContainer.classList.add('hidden');
        if (resultsContainer) resultsContainer.classList.remove('hidden');
        if (welcomeScreen) welcomeScreen.classList.add('hidden');
    }

    // Hide quiz interface (return to start)
    hideQuizInterface() {
        const quizContainer = document.getElementById('quizContainer');
        const welcomeScreen = document.getElementById('welcomeScreen');
        const resultsContainer = document.getElementById('resultsContainer');

        if (quizContainer) quizContainer.classList.add('hidden');
        if (welcomeScreen) welcomeScreen.classList.remove('hidden');
        if (resultsContainer) resultsContainer.classList.add('hidden');
    }

    // Save current quiz state
    saveQuizState() {
        if (this.currentQuiz && this.isQuizActive) {
            const state = {
                quiz: this.currentQuiz,
                currentQuestionIndex: this.currentQuestionIndex,
                score: this.score,
                userAnswers: this.userAnswers,
                startTime: this.startTime,
                questions: this.questions
            };
            window.storageManager.saveCurrentQuiz(state);
        }
    }

    // Load saved quiz state
    loadQuizState() {
        const state = window.storageManager.loadCurrentQuiz();
        if (state && state.quiz) {
            this.currentQuiz = state.quiz;
            this.questions = state.questions || [];
            this.currentQuestionIndex = state.currentQuestionIndex || 0;
            this.score = state.score || 0;
            this.userAnswers = state.userAnswers || [];
            this.startTime = state.startTime || Date.now();
            this.isQuizActive = true;

            // Continue quiz
            this.showQuizInterface();
            this.displayCurrentQuestion();

            console.log('Quiz state restored');
            return true;
        }
        return false;
    }

    // Save quiz results
    saveQuizResults() {
        // This could be extended to save detailed quiz history
        const results = {
            quizName: this.currentQuiz?.name || 'Quiz',
            score: this.score,
            totalQuestions: this.questions.length,
            percentage: Math.round((this.score / this.questions.length) * 100),
            completedAt: new Date().toISOString(),
            timeSpent: this.endTime - this.startTime,
            answers: this.userAnswers
        };

        // For now, just log the results
        console.log('Quiz results:', results);
        
        // Could save to IndexedDB for history tracking
        // window.storageManager.saveQuizResult(results);
    }

    // Utility: Shuffle array in place
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Utility: Create shuffle mapping for options
    createShuffleMapping(length) {
        const indices = Array.from({ length }, (_, i) => i);
        return this.shuffleArray(indices);
    }

    // Utility: Show toast notification
    showToast(message, type = 'info') {
        if (window.appManager && window.appManager.showToast) {
            window.appManager.showToast(message, type);
        } else {
            console.log(`Toast (${type}):`, message);
        }
    }


}

// Create global quiz manager instance
window.quizManager = new QuizManager();