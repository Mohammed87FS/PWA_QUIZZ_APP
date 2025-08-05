// Simplified App Manager for Quiz Master PWA

class AppManager {
    constructor() {
        this.currentFiles = [];
        this.settingsOpen = false;
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

        // JSON preview actions
        const saveJson = document.getElementById('saveJson');
        const discardJson = document.getElementById('discardJson');
        
        if (saveJson) {
            saveJson.addEventListener('click', () => this.saveCurrentJson());
        }
        
        if (discardJson) {
            discardJson.addEventListener('click', () => this.discardCurrentJson());
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

            this.showJsonPreview(file.name, data, validation);
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

    // Show JSON preview
    showJsonPreview(fileName, data, validation) {
        const preview = document.getElementById('jsonPreview');
        const questionCount = document.getElementById('previewQuestionCount');
        const categories = document.getElementById('previewCategories');

        if (preview) {
            preview.classList.remove('hidden');
            preview.dataset.fileName = fileName;
            preview.dataset.jsonData = JSON.stringify(data);
        }

        if (questionCount) {
            questionCount.textContent = `${validation.questionCount} Fragen`;
        }

        if (categories) {
            categories.textContent = `${validation.categories} Kategorien`;
        }
    }

    // Save current JSON
    async saveCurrentJson() {
        const preview = document.getElementById('jsonPreview');
        if (!preview) return;

        const fileName = preview.dataset.fileName;
        const jsonData = JSON.parse(preview.dataset.jsonData);

        try {
            await window.storageManager.saveQuizData(fileName, jsonData);
            console.log('Quiz data saved successfully');
            this.discardCurrentJson();
            await this.loadStoredFiles();
        } catch (error) {
            console.error('Error saving quiz data:', error);
            alert('Fehler beim Speichern der Daten.');
        }
    }

    // Discard current JSON preview
    discardCurrentJson() {
        const preview = document.getElementById('jsonPreview');
        const fileInput = document.getElementById('fileInput');
        
        if (preview) {
            preview.classList.add('hidden');
        }
        
        if (fileInput) {
            fileInput.value = '';
        }
    }

    // Load stored files
    async loadStoredFiles() {
        try {
            this.currentFiles = await window.storageManager.getStoredQuizFiles();
            this.updateQuizInfo();
            this.updateFilesDisplay();
        } catch (error) {
            console.error('Error loading stored files:', error);
        }
    }

    // Update quiz info
    updateQuizInfo() {
        const startBtn = document.getElementById('startQuiz');
        const stats = document.getElementById('quizStats');
        const questionCount = document.getElementById('questionCount');
        const categoryCount = document.getElementById('categoryCount');

        const hasFiles = this.currentFiles.length > 0;
        
        if (startBtn) {
            startBtn.disabled = !hasFiles;
        }

        if (stats) {
            stats.classList.toggle('hidden', !hasFiles);
        }

        if (hasFiles) {
            const totalQuestions = this.currentFiles.reduce((sum, file) => sum + file.questionCount, 0);
            const allCategories = new Set();
            this.currentFiles.forEach(file => {
                file.categories.forEach(cat => allCategories.add(cat));
            });

            if (questionCount) questionCount.textContent = totalQuestions;
            if (categoryCount) categoryCount.textContent = allCategories.size;
        }
    }

    // Update files display
    updateFilesDisplay() {
        const filesSection = document.getElementById('currentFiles');
        const filesList = document.getElementById('filesList');

        if (!filesList) return;

        if (this.currentFiles.length === 0) {
            if (filesSection) {
                filesSection.classList.add('hidden');
            }
            return;
        }

        if (filesSection) {
            filesSection.classList.remove('hidden');
        }

        filesList.innerHTML = '';

        this.currentFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.style.cssText = `
                background: var(--gray-100);
                padding: 1rem;
                border-radius: var(--radius);
                margin-bottom: 0.5rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;
            
            fileItem.innerHTML = `
                <div>
                    <strong>${file.name}</strong><br>
                    <small>${file.questionCount} Fragen, ${file.categories.length} Kategorien</small>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="appManager.useQuizFile(${file.id || index})" 
                            style="background: var(--primary); color: white; border: none; padding: 0.25rem 0.5rem; border-radius: var(--radius); cursor: pointer;">
                        Verwenden
                    </button>
                    <button onclick="appManager.deleteQuizFile(${file.id || index})" 
                            style="background: var(--danger); color: white; border: none; padding: 0.25rem 0.5rem; border-radius: var(--radius); cursor: pointer;">
                        Löschen
                    </button>
                </div>
            `;
            filesList.appendChild(fileItem);
        });
    }

    // Start quiz
    startQuiz() {
        if (this.currentFiles.length === 0) {
            alert('Keine Quiz-Daten verfügbar. Bitte lade zuerst eine JSON-Datei hoch.');
            return;
        }

        this.useQuizFile(this.currentFiles[0].id || 0);
    }

    // Use a specific quiz file
    async useQuizFile(fileId) {
        try {
            const quizData = await window.storageManager.getQuizData(fileId);
            if (quizData) {
                window.quizManager.startQuiz(quizData, quizData.name);
            }
        } catch (error) {
            console.error('Error loading quiz file:', error);
            alert('Fehler beim Laden der Quiz-Datei.');
        }
    }

    // Delete a quiz file
    async deleteQuizFile(fileId) {
        if (!confirm('Möchtest du diese Quiz-Datei wirklich löschen?')) {
            return;
        }

        try {
            await window.storageManager.deleteQuizData(fileId);
            await this.loadStoredFiles();
        } catch (error) {
            console.error('Error deleting quiz file:', error);
            alert('Fehler beim Löschen der Datei.');
        }
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
            this.currentFiles = [];
            this.updateFilesDisplay();
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