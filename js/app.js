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
            
            window.quizManager.init();
            this.setupEventListeners();
            this.loadSettings();
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

        // Start quiz
        const startQuiz = document.getElementById('startQuiz');
        if (startQuiz) {
            startQuiz.addEventListener('click', () => this.startQuiz());
        }

        // Settings checkboxes
        const settingsInputs = document.querySelectorAll('#settingsModal input[type="checkbox"]');
        settingsInputs.forEach(input => {
            input.addEventListener('change', () => this.saveSettings());
        });

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

            // Set current quiz data and update info
            this.currentQuizData = data;
            this.updateQuizInfo();
            
            alert(`Quiz erfolgreich geladen: ${data.questions.length} Fragen`);
        } catch (error) {
            console.error('Error processing file:', error);
            alert('Fehler beim Verarbeiten der Datei. Überprüfe das JSON-Format.');
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

    // Update quiz info
    updateQuizInfo() {
        const startBtn = document.getElementById('startQuiz');
        const stats = document.getElementById('quizStats');
        const questionCount = document.getElementById('questionCount');
        const categoryCount = document.getElementById('categoryCount');

        const hasData = !!this.currentQuizData;
        
        if (startBtn) {
            startBtn.disabled = !hasData;
        }

        if (stats) {
            stats.classList.toggle('hidden', !hasData);
        }

        if (hasData && this.currentQuizData.questions) {
            const totalQuestions = this.currentQuizData.questions.length;
            const allCategories = new Set();
            this.currentQuizData.questions.forEach(q => {
                if (q.category) allCategories.add(q.category);
            });

            if (questionCount) questionCount.textContent = totalQuestions;
            if (categoryCount) categoryCount.textContent = allCategories.size;
        }
    }

    // Start quiz
    startQuiz() {
        if (!this.currentQuizData) {
            alert('Keine Quiz-Daten verfügbar. Bitte lade zuerst eine JSON-Datei hoch.');
            return;
        }

        window.quizManager.startQuiz(this.currentQuizData, 'Quiz');
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

    // Load user settings (simplified)
    loadSettings() {
        try {
            const settings = JSON.parse(sessionStorage.getItem('quizSettings') || '{}');
            
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

    // Save settings (simplified)
    saveSettings() {
        const settings = {
            showExplanations: document.getElementById('showExplanations')?.checked || true,
            randomizeQuestions: document.getElementById('randomizeQuestions')?.checked || false,
            randomizeOptions: document.getElementById('randomizeOptions')?.checked || false,
            darkMode: document.getElementById('darkMode')?.checked || false
        };

        // Apply dark mode immediately
        if (settings.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        
        // Store in sessionStorage for current session only
        sessionStorage.setItem('quizSettings', JSON.stringify(settings));
    }

    // Clear current data
    clearAllData() {
        if (!confirm('Möchtest du das aktuelle Quiz wirklich löschen?')) {
            return;
        }

        this.currentQuizData = null;
        this.updateQuizInfo();
        window.quizManager.hideQuizInterface();
        sessionStorage.removeItem('quizSettings');
        console.log('Current quiz cleared');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.appManager = new AppManager();
    window.appManager.init();
});