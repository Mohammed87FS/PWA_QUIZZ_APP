// Simplified App Manager for Quiz Master PWA

class AppManager {
    constructor() {
        this.settingsOpen = false;
        this.currentQuizData = null;
    }

    // Initialize the application
    async init() {
        try {
            console.log('Initializing Quiz Master PWA...');
            
            // Check if storage manager exists
            if (!window.storageManager) {
                console.error('StorageManager not found!');
                return;
            }
            
            // Initialize storage manager first
            await window.storageManager.init();
            console.log('Storage manager initialized');
            
            // Check if quiz manager exists
            if (!window.quizManager) {
                console.error('QuizManager not found!');
                return;
            }
            
            window.quizManager.init();
            console.log('Quiz manager initialized');
            
            this.setupEventListeners();
            console.log('Event listeners set up');
            
            this.loadSettings();
            console.log('Settings loaded');
            
            // Removed saved quizzes loading - simplified interface
            
            this.updateQuizInfo();
            
            console.log('Quiz Master PWA initialized successfully');
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    }

    // Setup all event listeners
    setupEventListeners() {
        // Settings button
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.toggleSettings());
        }

        // Close settings
        const closeSettings = document.getElementById('closeSettings');
        if (closeSettings) {
            closeSettings.addEventListener('click', () => this.closeSettings());
        }

        // File input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // Quiz cards (built-in quizzes) - use event delegation
        document.addEventListener('click', (e) => {
            // Handle quiz card clicks
            const quizCard = e.target.closest('.quiz-card[data-quiz]');
            if (quizCard) {
                const quizName = quizCard.dataset.quiz;
                if (quizName) {
                    console.log('Quiz card clicked:', quizName);
                    e.preventDefault();
                    this.loadQuickQuiz(quizName);
                }
            }
            
            // Removed saved quiz handling - simplified interface
        });

        // Settings checkboxes (only essential ones remain)
        const showExplanations = document.getElementById('showExplanations');
        const darkMode = document.getElementById('darkMode');
        
        if (showExplanations) {
            showExplanations.addEventListener('change', () => this.saveSettings());
        }
        if (darkMode) {
            darkMode.addEventListener('change', () => this.saveSettings());
        }

        // Clear data
        const clearData = document.getElementById('clearData');
        if (clearData) {
            clearData.addEventListener('click', () => this.clearAllData());
        }

        // Click outside modal to close
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeSettings();
                }
            });
        }
    }

    // Handle file selection
    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type === 'application/json' && !file.name.endsWith('.json')) {
            alert('Bitte wähle eine JSON-Datei aus.');
            return;
        }

        try {
            const text = await this.readFileAsText(file);
            const data = JSON.parse(text);
            
            const validation = this.validateQuizData(data);
            
            if (!validation.valid) {
                alert(`JSON-Validierungsfehler: ${validation.errors[0]}`);
                return;
            }

            // Save quiz data persistently
            const quizName = file.name.replace('.json', '') || 'Quiz';
            const savedId = await window.storageManager.saveQuizData(quizName, data);
            
            // If currently in a quiz, ask for confirmation to switch
            if (window.quizManager.isQuizActive) {
                const confirmSwitch = confirm('Möchtest du das aktuelle Quiz beenden und das neue starten?');
                if (!confirmSwitch) {
                    return;
                }
                // Stop current quiz
                window.quizManager.forceEndQuiz();
            }
            
            // Set current quiz data
            this.currentQuizData = { ...data, name: quizName };
            
            // Auto-start the uploaded quiz
            window.quizManager.startQuiz(this.currentQuizData, this.currentQuizData.name || 'Quiz');
            
            alert(`Quiz erfolgreich geladen: ${data.questions.length} Fragen`);
        } catch (error) {
            console.error('Error processing file:', error);
            alert('Fehler beim Verarbeiten der Datei. Überprüfe das JSON-Format.');
        }
    }

    // Load a quick quiz from json_dbs directory
    async loadQuickQuiz(quizName) {
        console.log('loadQuickQuiz called with:', quizName);
        if (!quizName) return;
        
        // If currently in a quiz, ask for confirmation to switch
        if (window.quizManager && window.quizManager.isQuizActive) {
            const confirmSwitch = confirm('Möchtest du das aktuelle Quiz beenden und ein neues starten?');
            if (!confirmSwitch) {
                return;
            }
            // Stop current quiz
            window.quizManager.forceEndQuiz();
        }
        
        const quizFileName = `json_dbs/${quizName}.json`;

        try {
            console.log(`Loading preloaded quiz: ${quizFileName}`);
            
            // Fetch the JSON file
            const response = await fetch(quizFileName);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Validate the quiz data
            const validation = this.validateQuizData(data);
            if (!validation.valid) {
                alert(`Quiz-Validierungsfehler: ${validation.errors[0]}`);
                return;
            }

            // Get a friendly name for the quiz
            const friendlyNames = {
                'demokratie': 'Demokratie',
                'geschichte': 'Geschichte',
                'elektronik_quiz': 'Elektronik'
            };
            const displayName = friendlyNames[quizName] || quizName;

            // Set current quiz data
            this.currentQuizData = { ...data, name: displayName };
            
            // Auto-start the quiz for quick selection
            window.quizManager.startQuiz(this.currentQuizData, this.currentQuizData.name || 'Quiz');
            
        } catch (error) {
            console.error('Error loading preloaded quiz:', error);
            alert(`Fehler beim Laden des Quiz "${quizName}". Bitte versuche es erneut.`);
        }
    }

    // Read file as text
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
            reader.readAsText(file);
        });
    }

    // Simple JSON validation
    validateQuizData(data) {
        const errors = [];
        
        if (!data || typeof data !== 'object') {
            errors.push('Invalid JSON structure');
            return { valid: false, errors };
        }
        
        if (!data.questions || !Array.isArray(data.questions)) {
            errors.push('Questions array is required');
            return { valid: false, errors };
        }
        
        if (data.questions.length === 0) {
            errors.push('At least one question is required');
            return { valid: false, errors };
        }
        
        // Validate each question
        for (let i = 0; i < data.questions.length; i++) {
            const q = data.questions[i];
            if (!q.question || typeof q.question !== 'string') {
                errors.push(`Question ${i + 1}: Missing question text`);
            }
            if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
                errors.push(`Question ${i + 1}: At least 2 options required`);
            }
            if (typeof q.correct_answer !== 'number' || q.correct_answer < 0 || q.correct_answer >= q.options.length) {
                errors.push(`Question ${i + 1}: Invalid correct_answer index`);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors,
            questionCount: data.questions.length,
            categories: [...new Set(data.questions.map(q => q.category).filter(Boolean))].length
        };
    }

    // Load saved quizzes from storage
    async loadSavedQuizzes() {
        try {
            const savedQuizzes = await window.storageManager.getStoredQuizFiles();
            
            // If we have saved quizzes but no current quiz, load the most recent one
            if (savedQuizzes.length > 0 && !this.currentQuizData) {
                const mostRecent = savedQuizzes[savedQuizzes.length - 1];
                this.currentQuizData = {
                    id: mostRecent.id,
                    name: mostRecent.name,
                    questions: mostRecent.questions
                };
                console.log('Loaded most recent quiz:', mostRecent.name);
            }
            
            this.updateQuizList(savedQuizzes);
        } catch (error) {
            console.error('Error loading saved quizzes:', error);
        }
    }

    // Update quiz list in UI
    updateQuizList(quizzes) {
        const savedQuizzesSection = document.getElementById('savedQuizzesSection');
        const quizList = document.getElementById('quizList');
        
        if (!quizList) return;
        
        // Show/hide section based on available quizzes
        if (savedQuizzesSection) {
            savedQuizzesSection.classList.toggle('hidden', quizzes.length === 0);
        }
        
        // Clear existing list
        quizList.innerHTML = '';
        
        // Add each quiz as a card
        quizzes.forEach(quiz => {
            const quizItem = document.createElement('div');
            quizItem.className = 'quiz-item';
            quizItem.innerHTML = `
                <div class="quiz-info">
                    <div class="quiz-name">${quiz.name}</div>
                    <div class="quiz-details">${quiz.questionCount} Fragen</div>
                    <div class="quiz-date">${new Date(quiz.uploadDate).toLocaleDateString('de-DE')}</div>
                </div>
                <div class="quiz-actions">
                    <button class="quiz-select-btn" data-quiz-id="${quiz.id}">Starten</button>
                    <button class="quiz-delete-btn" data-quiz-id="${quiz.id}">🗑️</button>
                </div>
            `;
            quizList.appendChild(quizItem);
        });
        
        // Event listeners are now handled globally in setupEventListeners
        
        console.log('Quiz list updated:', quizzes.length, 'quizzes');
    }

    // Update quiz info (simplified - no longer needed with auto-start)
    updateQuizInfo() {
        // Quiz info is now displayed inline with each quiz option
        // No central quiz info display needed
    }

    // Select a quiz from the saved list
    async selectQuiz(quizId) {
        try {
            // If currently in a quiz, ask for confirmation to switch
            if (window.quizManager.isQuizActive) {
                const confirmSwitch = confirm('Möchtest du das aktuelle Quiz beenden und ein neues starten?');
                if (!confirmSwitch) {
                    return;
                }
                // Stop current quiz
                window.quizManager.forceEndQuiz();
            }
            
            const quizData = await window.storageManager.getQuizData(quizId);
            if (quizData) {
                this.currentQuizData = {
                    id: quizData.id,
                    name: quizData.name,
                    questions: quizData.questions
                };
                this.updateQuizInfo();
                
                // Auto-start the selected quiz
                window.quizManager.startQuiz(this.currentQuizData, this.currentQuizData.name || 'Quiz');
                
                console.log('Quiz selected and started:', quizData.name);
            }
        } catch (error) {
            console.error('Error selecting quiz:', error);
            alert('Fehler beim Laden des Quiz.');
        }
    }

    // Delete a quiz from storage
    async deleteQuiz(quizId) {
        if (!confirm('Möchtest du dieses Quiz wirklich löschen?')) {
            return;
        }

        try {
            await window.storageManager.deleteQuizData(quizId);
            
            // If deleted quiz was currently selected, clear it
            if (this.currentQuizData && this.currentQuizData.id === quizId) {
                this.currentQuizData = null;
                this.updateQuizInfo();
            }
            
            // Refresh quiz list
            await this.loadSavedQuizzes();
            
            console.log('Quiz deleted:', quizId);
        } catch (error) {
            console.error('Error deleting quiz:', error);
            alert('Fehler beim Löschen des Quiz.');
        }
    }

    // Start quiz (now handled automatically when quiz is selected)
    startQuiz() {
        // This method is no longer used - quizzes auto-start on selection
    }

    // Check if there's a quiz to resume
    checkResumeQuiz() {
        if (window.quizManager.loadQuizState()) {
            console.log('Previous quiz resumed');
        }
    }

    // Settings methods
    toggleSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.toggle('hidden');
            this.settingsOpen = !modal.classList.contains('hidden');
        }
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.add('hidden');
            this.settingsOpen = false;
        }
    }

    // Load user settings (using localStorage for persistence)
    loadSettings() {
        try {
            // Use storageManager if available, otherwise fallback to localStorage
            const settings = window.storageManager ? 
                window.storageManager.loadSettings() : 
                JSON.parse(localStorage.getItem('quizSettings') || '{}');
            
            // Set default values
            const defaults = {
                showExplanations: true,
                randomizeQuestions: false,
                randomizeOptions: false,
                darkMode: false
            };
            
            const finalSettings = { ...defaults, ...settings };
            
            // Apply to UI
            Object.entries(finalSettings).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.checked = value;
                }
            });

            // Apply dark mode
            if (finalSettings.darkMode) {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
        } catch (error) {
            console.log('No previous settings found');
        }
    }

    // Save settings (using localStorage for persistence)
    saveSettings() {
        const settings = {
            showExplanations: document.getElementById('showExplanations')?.checked || true,
            darkMode: document.getElementById('darkMode')?.checked || false
        };

        // Apply dark mode immediately
        if (settings.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        
        // Store persistently using storageManager if available
        if (window.storageManager) {
            window.storageManager.saveSettings(settings);
        } else {
            localStorage.setItem('quizSettings', JSON.stringify(settings));
        }
    }

    // Clear current data
    async clearAllData() {
        if (!confirm('Möchtest du wirklich ALLE gespeicherten Quiz-Daten löschen? Dies kann nicht rückgängig gemacht werden.')) {
            return;
        }

        try {
            // Clear all stored quizzes
            if (window.storageManager) {
                await window.storageManager.clearAllQuizData();
            }
            
            this.currentQuizData = null;
            this.updateQuizInfo();
            window.quizManager.hideQuizInterface();
            
            alert('Alle Quiz-Daten wurden gelöscht.');
            console.log('All quiz data cleared');
        } catch (error) {
            console.error('Error clearing data:', error);
            alert('Fehler beim Löschen der Daten.');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.appManager = new AppManager();
    window.appManager.init();
});