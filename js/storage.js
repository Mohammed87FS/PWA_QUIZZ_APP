// Storage Manager for Quiz Master PWA
// Handles IndexedDB operations and localStorage fallback

class StorageManager {
    constructor() {
        this.dbName = 'QuizMasterDB';
        this.dbVersion = 1;
        this.db = null;
        this.storeName = 'quizData';
        this.settingsKey = 'quizMasterSettings';
        this.currentQuizKey = 'currentQuizData';
    }

    // Initialize IndexedDB
    async init() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.warn('IndexedDB not supported, falling back to localStorage');
                resolve(false);
                return;
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Error opening IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve(true);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store for quiz data
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('uploadDate', 'uploadDate', { unique: false });
                }
            };
        });
    }

    // Save quiz data to IndexedDB
    async saveQuizData(name, questionsData) {
        const data = {
            name: name,
            questions: questionsData.questions,
            uploadDate: new Date().toISOString(),
            questionCount: questionsData.questions.length,
            categories: [...new Set(questionsData.questions.map(q => q.category))]
        };

        if (this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.add(data);

                request.onsuccess = () => {
                    console.log('Quiz data saved to IndexedDB');
                    resolve(request.result);
                };

                request.onerror = () => {
                    console.error('Error saving to IndexedDB:', request.error);
                    reject(request.error);
                };
            });
        } else {
            // Fallback to localStorage
            const storedData = this.getStoredQuizFiles();
            storedData.push(data);
            localStorage.setItem('quizFiles', JSON.stringify(storedData));
            return Promise.resolve(storedData.length - 1);
        }
    }

    // Get all stored quiz files
    async getStoredQuizFiles() {
        if (this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.getAll();

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    console.error('Error retrieving from IndexedDB:', request.error);
                    reject(request.error);
                };
            });
        } else {
            // Fallback to localStorage
            const stored = localStorage.getItem('quizFiles');
            return Promise.resolve(stored ? JSON.parse(stored) : []);
        }
    }

    // Get specific quiz data by ID
    async getQuizData(id) {
        if (this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(id);

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    console.error('Error retrieving quiz data:', request.error);
                    reject(request.error);
                };
            });
        } else {
            // Fallback to localStorage
            const storedData = this.getStoredQuizFiles();
            return Promise.resolve(storedData[id] || null);
        }
    }

    // Delete quiz data
    async deleteQuizData(id) {
        if (this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.delete(id);

                request.onsuccess = () => {
                    console.log('Quiz data deleted from IndexedDB');
                    resolve(true);
                };

                request.onerror = () => {
                    console.error('Error deleting from IndexedDB:', request.error);
                    reject(request.error);
                };
            });
        } else {
            // Fallback to localStorage
            const storedData = this.getStoredQuizFiles();
            storedData.splice(id, 1);
            localStorage.setItem('quizFiles', JSON.stringify(storedData));
            return Promise.resolve(true);
        }
    }

    // Clear all quiz data
    async clearAllQuizData() {
        if (this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.clear();

                request.onsuccess = () => {
                    console.log('All quiz data cleared from IndexedDB');
                    resolve(true);
                };

                request.onerror = () => {
                    console.error('Error clearing IndexedDB:', request.error);
                    reject(request.error);
                };
            });
        } else {
            // Fallback to localStorage
            localStorage.removeItem('quizFiles');
            localStorage.removeItem(this.currentQuizKey);
            return Promise.resolve(true);
        }
    }

    // Save settings to localStorage
    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    // Load settings from localStorage
    loadSettings() {
        try {
            const settings = localStorage.getItem(this.settingsKey);
            return settings ? JSON.parse(settings) : this.getDefaultSettings();
        } catch (error) {
            console.error('Error loading settings:', error);
            return this.getDefaultSettings();
        }
    }

    // Get default settings
    getDefaultSettings() {
        return {
            showExplanations: true,
            randomizeQuestions: false,
            randomizeOptions: false,
            darkMode: false
        };
    }

    // Save current quiz session
    saveCurrentQuiz(quizData) {
        try {
            localStorage.setItem(this.currentQuizKey, JSON.stringify(quizData));
            return true;
        } catch (error) {
            console.error('Error saving current quiz:', error);
            return false;
        }
    }

    // Load current quiz session
    loadCurrentQuiz() {
        try {
            const quiz = localStorage.getItem(this.currentQuizKey);
            return quiz ? JSON.parse(quiz) : null;
        } catch (error) {
            console.error('Error loading current quiz:', error);
            return null;
        }
    }

    // Clear current quiz session
    clearCurrentQuiz() {
        try {
            localStorage.removeItem(this.currentQuizKey);
            return true;
        } catch (error) {
            console.error('Error clearing current quiz:', error);
            return false;
        }
    }

    // Validate JSON quiz data structure
    validateQuizData(data) {
        const errors = [];

        // Check if data has questions array
        if (!data || !Array.isArray(data.questions)) {
            errors.push('JSON muss ein "questions" Array enthalten');
            return { valid: false, errors };
        }

        // Check each question
        data.questions.forEach((question, index) => {
            const questionNum = index + 1;

            // Required fields
            if (!question.id) {
                errors.push(`Frage ${questionNum}: "id" fehlt`);
            }
            if (!question.question) {
                errors.push(`Frage ${questionNum}: "question" fehlt`);
            }
            if (!question.category) {
                errors.push(`Frage ${questionNum}: "category" fehlt`);
            }

            // Options validation
            if (!Array.isArray(question.options)) {
                errors.push(`Frage ${questionNum}: "options" muss ein Array sein`);
            } else if (question.options.length !== 4) {
                errors.push(`Frage ${questionNum}: Genau 4 Antwortoptionen erforderlich`);
            }

            // Correct answer validation
            if (typeof question.correct_answer !== 'number') {
                errors.push(`Frage ${questionNum}: "correct_answer" muss eine Zahl sein`);
            } else if (question.correct_answer < 0 || question.correct_answer > 3) {
                errors.push(`Frage ${questionNum}: "correct_answer" muss zwischen 0 und 3 liegen`);
            }
        });

        return {
            valid: errors.length === 0,
            errors: errors,
            questionCount: data.questions.length,
            categories: [...new Set(data.questions.map(q => q.category))].length
        };
    }

    // Export all data for backup
    async exportAllData() {
        try {
            const quizFiles = await this.getStoredQuizFiles();
            const settings = this.loadSettings();
            const currentQuiz = this.loadCurrentQuiz();

            const exportData = {
                exportDate: new Date().toISOString(),
                version: '1.0.0',
                quizFiles: quizFiles,
                settings: settings,
                currentQuiz: currentQuiz
            };

            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }

    // Import data from backup
    async importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            // Validate import data structure
            if (!data.quizFiles || !Array.isArray(data.quizFiles)) {
                throw new Error('Ungültiges Backup-Format');
            }

            // Clear existing data
            await this.clearAllQuizData();

            // Import quiz files
            for (const quizFile of data.quizFiles) {
                await this.saveQuizData(quizFile.name, { questions: quizFile.questions });
            }

            // Import settings if available
            if (data.settings) {
                this.saveSettings(data.settings);
            }

            // Import current quiz if available
            if (data.currentQuiz) {
                this.saveCurrentQuiz(data.currentQuiz);
            }

            return { success: true, importedFiles: data.quizFiles.length };
        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    }

    // Get storage usage information
    async getStorageInfo() {
        try {
            const quizFiles = await this.getStoredQuizFiles();
            const totalQuestions = quizFiles.reduce((sum, file) => sum + file.questionCount, 0);
            const allCategories = new Set();
            
            quizFiles.forEach(file => {
                file.categories.forEach(cat => allCategories.add(cat));
            });

            // Estimate storage usage
            const estimatedSize = JSON.stringify(quizFiles).length;

            return {
                fileCount: quizFiles.length,
                totalQuestions: totalQuestions,
                totalCategories: allCategories.size,
                estimatedSizeKB: Math.round(estimatedSize / 1024)
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return {
                fileCount: 0,
                totalQuestions: 0,
                totalCategories: 0,
                estimatedSizeKB: 0
            };
        }
    }
}

// Create global storage manager instance
window.storageManager = new StorageManager();