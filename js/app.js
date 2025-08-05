// Main Application Logic for Quiz Master PWA
// Handles UI interactions, navigation, file uploads, and app coordination

class AppManager {
    constructor() {
        this.currentScreen = 'homeScreen';
        this.isMenuOpen = false;
        this.installPrompt = null;
        this.isOnline = navigator.onLine;
        this.currentFiles = [];
    }

    // Initialize the application
    async init() {
        try {
            console.log('Initializing Quiz Master PWA...');
            
            // Initialize storage
            await window.storageManager.init();
            
            // Initialize quiz manager
            window.quizManager.init();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup PWA features
            this.setupPWA();
            
            // Load settings and apply theme
            this.loadAndApplySettings();
            
            // Load stored files
            await this.loadStoredFiles();
            
            // Check for resumed quiz
            this.checkResumeQuiz();
            
            // Show online/offline status
            this.updateOnlineStatus();
            
            console.log('Quiz Master PWA initialized successfully');
            
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    }

    // Setup all event listeners
    setupEventListeners() {
        // Navigation
        this.setupNavigation();
        
        // File upload
        this.setupFileUpload();
        
        // Quiz controls
        this.setupQuizControls();
        
        // Settings
        this.setupSettings();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Online/offline events
        window.addEventListener('online', () => this.updateOnlineStatus());
        window.addEventListener('offline', () => this.updateOnlineStatus());
    }

    // Setup navigation event listeners
    setupNavigation() {
        // Menu toggle
        const menuBtn = document.getElementById('menuBtn');
        const navMenu = document.getElementById('navMenu');
        const overlay = document.getElementById('overlay');

        if (menuBtn) {
            menuBtn.addEventListener('click', () => this.toggleMenu());
        }

        if (overlay) {
            overlay.addEventListener('click', () => this.closeMenu());
        }

        // Navigation links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetScreen = this.getScreenFromNavId(link.id);
                if (targetScreen) {
                    this.showScreen(targetScreen);
                    this.setActiveNavLink(link.id);
                    this.closeMenu();
                }
            });
        });
    }

    // Setup file upload functionality
    setupFileUpload() {
        const fileInput = document.getElementById('fileInput');
        const fileUploadLabel = document.querySelector('.file-upload-label');
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
        
        // Drag and drop
        if (fileUploadLabel) {
            fileUploadLabel.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileUploadLabel.classList.add('drag-over');
            });
            
            fileUploadLabel.addEventListener('dragleave', () => {
                fileUploadLabel.classList.remove('drag-over');
            });
            
            fileUploadLabel.addEventListener('drop', (e) => {
                e.preventDefault();
                fileUploadLabel.classList.remove('drag-over');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.processFile(files[0]);
                }
            });
        }

        // JSON preview buttons
        const saveBtn = document.getElementById('saveJson');
        const discardBtn = document.getElementById('discardJson');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveCurrentJson());
        }
        
        if (discardBtn) {
            discardBtn.addEventListener('click', () => this.discardCurrentJson());
        }
    }

    // Setup quiz control event listeners
    setupQuizControls() {
        const startQuizBtn = document.getElementById('startQuiz');
        const loadSampleBtn = document.getElementById('loadSample');
        
        if (startQuizBtn) {
            startQuizBtn.addEventListener('click', () => this.startQuiz());
        }
        
        if (loadSampleBtn) {
            loadSampleBtn.addEventListener('click', () => this.loadSampleQuiz());
        }
    }

    // Setup settings event listeners
    setupSettings() {
        const settingsInputs = document.querySelectorAll('#settingsScreen input[type="checkbox"]');
        settingsInputs.forEach(input => {
            input.addEventListener('change', () => this.saveSettings());
        });

        const clearDataBtn = document.getElementById('clearData');
        const exportDataBtn = document.getElementById('exportData');
        
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => this.clearAllData());
        }
        
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => this.exportData());
        }
    }

    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Escape key to close menu
            if (e.key === 'Escape') {
                this.closeMenu();
            }
            
            // Number keys for quiz answers (1-4)
            if (window.quizManager.isQuizActive && !window.quizManager.hasAnswered) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= 4) {
                    const option = document.querySelector(`.option[data-index="${num - 1}"]`);
                    if (option) {
                        window.quizManager.selectAnswer(option);
                    }
                }
                
                // Enter to submit answer
                if (e.key === 'Enter' && window.quizManager.selectedAnswer !== null) {
                    window.quizManager.submitAnswer();
                }
            }
        });
    }

    // Setup PWA features
    setupPWA() {
        // Install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.installPrompt = e;
            this.showInstallButton();
        });

        // App installed
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            this.hideInstallButton();
        });

        // iOS install detection
        if (this.isIOS() && !this.isInStandaloneMode()) {
            this.showIOSInstallInstructions();
        }
    }

    // Handle file selection
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    // Process uploaded file
    async processFile(file) {
        if (!file.type === 'application/json' && !file.name.endsWith('.json')) {
            console.error('Invalid file type: Please select a JSON file');
            return;
        }

        try {
            const text = await this.readFileAsText(file);
            const data = JSON.parse(text);
            
            // Validate the JSON structure
            const validation = window.storageManager.validateQuizData(data);
            
            if (!validation.valid) {
                console.error(`JSON validation error: ${validation.errors[0]}`);
                return;
            }

            // Show preview
            this.showJsonPreview(file.name, data, validation);
            
        } catch (error) {
            console.error('Error processing file:', error);
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
        const previewSection = document.getElementById('jsonPreview');
        const questionCountSpan = document.getElementById('previewQuestionCount');
        const categoriesSpan = document.getElementById('previewCategories');
        const jsonTextarea = document.getElementById('jsonContent');

        if (previewSection) {
            previewSection.classList.remove('hidden');
            previewSection.dataset.fileName = fileName;
            previewSection.dataset.jsonData = JSON.stringify(data);
        }

        if (questionCountSpan) {
            questionCountSpan.textContent = `${validation.questionCount} Fragen`;
        }

        if (categoriesSpan) {
            categoriesSpan.textContent = `${validation.categories} Kategorien`;
        }

        if (jsonTextarea) {
            jsonTextarea.value = JSON.stringify(data, null, 2);
        }

        console.log(`JSON file loaded: ${validation.questionCount} questions`);
    }

    // Save current JSON to storage
    async saveCurrentJson() {
        const previewSection = document.getElementById('jsonPreview');
        if (!previewSection) return;

        const fileName = previewSection.dataset.fileName;
        const jsonData = JSON.parse(previewSection.dataset.jsonData);

        try {
            await window.storageManager.saveQuizData(fileName, jsonData);
            console.log('Quiz data saved successfully');
            this.discardCurrentJson();
            await this.loadStoredFiles();
            
        } catch (error) {
            console.error('Error saving quiz data:', error);
        }
    }

    // Discard current JSON preview
    discardCurrentJson() {
        const previewSection = document.getElementById('jsonPreview');
        const fileInput = document.getElementById('fileInput');
        
        if (previewSection) {
            previewSection.classList.add('hidden');
        }
        
        if (fileInput) {
            fileInput.value = '';
        }
    }

    // Load and display stored files
    async loadStoredFiles() {
        try {
            this.currentFiles = await window.storageManager.getStoredQuizFiles();
            this.updateFilesDisplay();
            this.updateQuizInfo();
        } catch (error) {
            console.error('Error loading stored files:', error);
        }
    }

    // Update files display
    updateFilesDisplay() {
        const currentFilesSection = document.getElementById('currentFiles');
        const filesList = document.getElementById('filesList');

        if (!filesList) return;

        if (this.currentFiles.length === 0) {
            if (currentFilesSection) {
                currentFilesSection.classList.add('hidden');
            }
            return;
        }

        if (currentFilesSection) {
            currentFilesSection.classList.remove('hidden');
        }

        filesList.innerHTML = '';

        this.currentFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <h4>${file.name}</h4>
                    <p>${file.questionCount} Fragen, ${file.categories.length} Kategorien</p>
                    <small>Hochgeladen: ${new Date(file.uploadDate).toLocaleDateString('de-DE')}</small>
                </div>
                <div class="file-actions">
                    <button class="btn btn-outline btn-sm" onclick="appManager.useQuizFile(${file.id || index})">
                        Verwenden
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="appManager.deleteQuizFile(${file.id || index})">
                        Löschen
                    </button>
                </div>
            `;
            filesList.appendChild(fileItem);
        });
    }

    // Update quiz info on home screen
    updateQuizInfo() {
        const startQuizBtn = document.getElementById('startQuiz');
        const quizStats = document.getElementById('quizStats');
        const questionCount = document.getElementById('questionCount');
        const categoryCount = document.getElementById('categoryCount');

        const hasFiles = this.currentFiles.length > 0;
        
        if (startQuizBtn) {
            startQuizBtn.disabled = !hasFiles;
        }

        if (quizStats) {
            quizStats.classList.toggle('hidden', !hasFiles);
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

    // Use a specific quiz file
    async useQuizFile(fileId) {
        try {
            const quizData = await window.storageManager.getQuizData(fileId);
            if (quizData) {
                window.quizManager.startQuiz(quizData, quizData.name);
                this.showScreen('homeScreen');
                this.setActiveNavLink('homeTab');
            }
        } catch (error) {
            console.error('Error loading quiz file:', error);
        }
    }

    // Delete a quiz file
    async deleteQuizFile(fileId) {
        if (!confirm('Möchten Sie diese Quiz-Datei wirklich löschen?')) {
            return;
        }

        try {
            await window.storageManager.deleteQuizData(fileId);
            console.log('Quiz file deleted');
            await this.loadStoredFiles();
        } catch (error) {
            console.error('Error deleting quiz file:', error);
        }
    }

    // Start quiz with available data
    startQuiz() {
        if (this.currentFiles.length === 0) {
            console.warn('No quiz data available. Please upload a JSON file first.');
            return;
        }

        // Use the first available file for now
        // Could be extended to let user choose
        this.useQuizFile(this.currentFiles[0].id || 0);
    }

    // Load sample quiz
    loadSampleQuiz() {
        const sampleData = window.quizManager.getSampleQuizData();
        window.quizManager.startQuiz(sampleData, 'Beispiel-Quiz');
        console.log('Sample quiz started');
    }

    // Check if there's a quiz to resume
    checkResumeQuiz() {
        if (window.quizManager.loadQuizState()) {
            console.log('Previous quiz resumed');
        }
    }

    // Navigation methods
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
        }

        // Update page title
        this.updatePageTitle(screenId);
    }

    getScreenFromNavId(navId) {
        const mapping = {
            'homeTab': 'homeScreen',
            'uploadTab': 'uploadScreen',
            'settingsTab': 'settingsScreen',
            'aboutTab': 'aboutScreen'
        };
        return mapping[navId];
    }

    setActiveNavLink(navId) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.getElementById(navId);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    updatePageTitle(screenId) {
        const titles = {
            'homeScreen': 'Quiz Master',
            'uploadScreen': 'JSON verwalten',
            'settingsScreen': 'Einstellungen',
            'aboutScreen': 'Über die App'
        };
        
        document.title = titles[screenId] || 'Quiz Master PWA';
    }

    // Menu methods
    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        const navMenu = document.getElementById('navMenu');
        const overlay = document.getElementById('overlay');
        
        if (navMenu) {
            navMenu.classList.toggle('hidden', !this.isMenuOpen);
        }
        
        if (overlay) {
            overlay.classList.toggle('hidden', !this.isMenuOpen);
        }
    }

    closeMenu() {
        this.isMenuOpen = false;
        const navMenu = document.getElementById('navMenu');
        const overlay = document.getElementById('overlay');
        
        if (navMenu) {
            navMenu.classList.add('hidden');
        }
        
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    // Settings methods
    loadAndApplySettings() {
        const settings = window.storageManager.loadSettings();
        
        // Apply settings to UI
        const settingsInputs = {
            'showExplanations': settings.showExplanations,
            'randomizeQuestions': settings.randomizeQuestions,
            'randomizeOptions': settings.randomizeOptions,
            'darkMode': settings.darkMode
        };

        Object.entries(settingsInputs).forEach(([id, value]) => {
            const input = document.getElementById(id);
            if (input) {
                input.checked = value;
            }
        });

        // Apply dark mode
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

        // Apply dark mode immediately
        if (settings.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        console.log('Settings saved');
    }

    // Data management
    async clearAllData() {
        if (!confirm('Möchten Sie wirklich alle Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
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
        }
    }

    async exportData() {
        try {
            const exportData = await window.storageManager.exportAllData();
            this.downloadFile(exportData, 'quiz-master-backup.json', 'application/json');
            console.log('Data exported successfully');
        } catch (error) {
            console.error('Error exporting data:', error);
        }
    }

    // Utility methods
    downloadFile(content, fileName, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    updateOnlineStatus() {
        this.isOnline = navigator.onLine;
        const statusText = this.isOnline ? 'Online' : 'Offline';
        console.log('Network status:', statusText);
        
        if (!this.isOnline) {
            console.log('Offline mode active');
        }
    }

    // PWA installation
    showInstallButton() {
        // Could add an install button to the UI
        console.log('PWA install prompt available');
    }

    hideInstallButton() {
        // Hide install button after installation
        console.log('PWA install button hidden');
    }

    async installPWA() {
        if (this.installPrompt) {
            const result = await this.installPrompt.prompt();
            console.log('Install prompt result:', result);
            this.installPrompt = null;
        }
    }

    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    isInStandaloneMode() {
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    }

    showIOSInstallInstructions() {
        // Could show iOS-specific installation instructions
        console.log('iOS device detected - install instructions available');
    }

    // Toast notifications - DISABLED
    showToast(message, type = 'info', duration = 4000) {
        // Notifications disabled - method does nothing
        return;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.appManager = new AppManager();
    window.appManager.init();
});

// Make appManager globally available
window.appManager = window.appManager || new AppManager();