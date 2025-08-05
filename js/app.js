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
            
            await window.storageManager.init();
            window.quizManager.init();
            
            this.setupEventListeners();
            this.loadSettings();
            await this.loadStoredFiles();
            this.checkResumeQuiz();
            
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

        // File upload
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
            
            const validation = window.storageManager.validateQuizData(data);
            
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
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
            reader.readAsText(file);
        });
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

    loadSettings() {
        const settings = window.storageManager.loadSettings();
        
        const inputs = {
            'showExplanations': settings.showExplanations,
            'randomizeQuestions': settings.randomizeQuestions,
            'randomizeOptions': settings.randomizeOptions,
            'darkMode': settings.darkMode
        };

        Object.entries(inputs).forEach(([id, value]) => {
            const input = document.getElementById(id);
            if (input) {
                input.checked = value;
            }
        });

        if (settings.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    saveSettings() {
        const settings = {
            showExplanations: document.getElementById('showExplanations')?.checked || true,
            randomizeQuestions: document.getElementById('randomizeQuestions')?.checked || false,
            randomizeOptions: document.getElementById('randomizeOptions')?.checked || false,
            darkMode: document.getElementById('darkMode')?.checked || false
        };

        window.storageManager.saveSettings(settings);
        window.quizManager.loadSettings();

        if (settings.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }

    // Clear all data
        async clearAllData() {
        if (!confirm('Möchtest du wirklich alle Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            return;
        }

        try {
            await window.storageManager.clearAllQuizData();
            this.currentQuizData = null;
            this.updateQuizInfo();
            window.quizManager.hideQuizInterface();
            console.log('All data cleared');
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