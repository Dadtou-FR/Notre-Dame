/**
 * Scripts principaux pour l'application de gestion d'école
 */

// Configuration globale
const AppConfig = {
    apiBaseUrl: '/api',
    ajaxBaseUrl: '/ajax',
    itemsPerPage: 10,
    debounceDelay: 500,
    animationDuration: 300
};

// Utility Functions
const Utils = {
    // Fonction debounce pour optimiser les requêtes de recherche
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    // Formatage des dates
    formatDate(date, format = 'fr-FR') {
        if (!date) return '-';
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date(date).toLocaleDateString(format, options);
    },

    // Formatage des nombres
    formatNumber(number, decimals = 0) {
        if (isNaN(number)) return '-';
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    },

    // Formatage de la monnaie
    formatCurrency(amount) {
        if (isNaN(amount)) return '-';
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF' // Franc CFA
        }).format(amount);
    },

    // Validation d'email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Validation de téléphone
    isValidPhone(phone) {
        const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8;
    },

    // Nettoyage des chaînes
    sanitizeString(str) {
        if (!str) return '';
        return str.trim().replace(/\s+/g, ' ');
    },

    // Génération d'ID aléatoire
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    },

    // Copie dans le presse-papier
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copié dans le presse-papier!', 'success');
        } catch (err) {
            console.error('Erreur copie presse-papier:', err);
            this.showToast('Erreur lors de la copie', 'error');
        }
    },

    // Affichage de notifications toast
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${this.getToastIcon(type)} me-2"></i>
                <span>${message}</span>
            </div>
            <button type="button" class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Styles inline pour le toast
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            background: white;
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            animation: slideInRight 0.3s ease;
            border-left: 4px solid ${this.getToastColor(type)};
        `;

        document.body.appendChild(toast);

        // Auto-suppression
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    },

    getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    },

    getToastColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }
};

// Gestionnaire d'API
const ApiManager = {
    // Requête GET générique
    async get(endpoint, params = {}) {
        try {
            const url = new URL(endpoint, window.location.origin);
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                    url.searchParams.append(key, params[key]);
                }
            });

            const response = await fetch(url);
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur GET:', error);
            throw error;
        }
    },

    // Requête POST générique
    async post(endpoint, data = {}) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur POST:', error);
            throw error;
        }
    },

    // Requête PUT générique
    async put(endpoint, data = {}) {
        try {
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur PUT:', error);
            throw error;
        }
    },

    // Requête DELETE générique
    async delete(endpoint) {
        try {
            const response = await fetch(endpoint, {
                method: 'DELETE'
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Erreur DELETE:', error);
            throw error;
        }
    },

    // Gestion des réponses
    async handleResponse(response) {
        const contentType = response.headers.get('content-type');
        
        if (!response.ok) {
            const errorData = contentType?.includes('application/json') 
                ? await response.json() 
                : { message: response.statusText };
            throw new Error(errorData.message || 'Erreur réseau');
        }

        if (contentType?.includes('application/json')) {
            return await response.json();
        }

        return await response.text();
    }
};

// Gestionnaire de formulaires
const FormManager = {
    // Validation d'un formulaire
    validateForm(formId, rules = {}) {
        const form = document.getElementById(formId);
        if (!form) return false;

        const errors = [];
        const formData = new FormData(form);

        // Validation des champs requis
        form.querySelectorAll('[required]').forEach(field => {
            if (!field.value.trim()) {
                errors.push(`Le champ "${field.labels?.[0]?.textContent || field.name}" est requis`);
                this.markFieldError(field);
            } else {
                this.markFieldValid(field);
            }
        });

        // Validation email
        form.querySelectorAll('input[type="email"]').forEach(field => {
            if (field.value && !Utils.isValidEmail(field.value)) {
                errors.push('Format d\'email invalide');
                this.markFieldError(field);
            }
        });

        // Validation téléphone
        form.querySelectorAll('input[type="tel"]').forEach(field => {
            if (field.value && !Utils.isValidPhone(field.value)) {
                errors.push('Format de téléphone invalide');
                this.markFieldError(field);
            }
        });

        // Validation personnalisée
        Object.keys(rules).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            const rule = rules[fieldName];
            
            if (field && rule.validator && !rule.validator(field.value)) {
                errors.push(rule.message);
                this.markFieldError(field);
            }
        });

        if (errors.length > 0) {
            Utils.showToast(`Erreurs de validation:\n${errors.join('\n')}`, 'error');
            return false;
        }

        return true;
    },

    // Marquer un champ comme invalide
    markFieldError(field) {
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
    },

    // Marquer un champ comme valide
    markFieldValid(field) {
        field.classList.add('is-valid');
        field.classList.remove('is-invalid');
    },

    // Réinitialiser la validation d'un formulaire
    resetValidation(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.querySelectorAll('.is-invalid, .is-valid').forEach(field => {
            field.classList.remove('is-invalid', 'is-valid');
        });
    },

    // Récupérer les données d'un formulaire
    getFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return {};

        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            // Gestion des checkboxes multiples
            if (data[key]) {
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }

        return data;
    },

    // Remplir un formulaire avec des données
    fillForm(formId, data) {
        const form = document.getElementById(formId);
        if (!form) return;

        Object.keys(data).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = Boolean(data[key]);
                } else if (field.type === 'radio') {
                    const radioField = form.querySelector(`[name="${key}"][value="${data[key]}"]`);
                    if (radioField) radioField.checked = true;
                } else {
                    field.value = data[key] || '';
                }
            }
        });
    }
};

// Gestionnaire de tableaux
const TableManager = {
    // Initialiser un tableau avec tri et recherche
    initTable(tableId, options = {}) {
        const table = document.getElementById(tableId);
        if (!table) return;

        // Ajouter la recherche si demandée
        if (options.searchable) {
            this.addSearchToTable(table, options.searchColumns);
        }

        // Ajouter le tri si demandé
        if (options.sortable) {
            this.addSortToTable(table);
        }

        // Ajouter la pagination si demandée
        if (options.paginated) {
            this.addPaginationToTable(table, options.itemsPerPage);
        }
    },

    // Ajouter la recherche à un tableau
    addSearchToTable(table, searchColumns = []) {
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'form-control mb-3';
        searchInput.placeholder = 'Rechercher dans le tableau...';

        table.parentNode.insertBefore(searchInput, table);

        searchInput.addEventListener('input', Utils.debounce((e) => {
            this.filterTableRows(table, e.target.value, searchColumns);
        }, AppConfig.debounceDelay));
    },

    // Filtrer les lignes du tableau
    filterTableRows(table, searchTerm, searchColumns = []) {
        const tbody = table.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            let rowText = '';
            
            if (searchColumns.length > 0) {
                searchColumns.forEach(colIndex => {
                    if (cells[colIndex]) {
                        rowText += cells[colIndex].textContent.toLowerCase() + ' ';
                    }
                });
            } else {
                cells.forEach(cell => {
                    rowText += cell.textContent.toLowerCase() + ' ';
                });
            }
            
            const shouldShow = rowText.includes(searchTerm.toLowerCase());
            row.style.display = shouldShow ? '' : 'none';
        });
    },

    // Ajouter le tri au tableau
    addSortToTable(table) {
        const headers = table.querySelectorAll('thead th');
        
        headers.forEach((header, index) => {
            if (header.dataset.sortable === 'false') return;
            
            header.style.cursor = 'pointer';
            header.innerHTML += ' <i class="fas fa-sort text-muted"></i>';
            
            header.addEventListener('click', () => {
                this.sortTable(table, index);
            });
        });
    },

    // Trier le tableau
    sortTable(table, columnIndex) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const header = table.querySelectorAll('thead th')[columnIndex];
        const icon = header.querySelector('i');
        
        // Déterminer l'ordre de tri
        let ascending = true;
        if (icon.classList.contains('fa-sort-up')) {
            ascending = false;
        }
        
        // Réinitialiser toutes les icônes
        table.querySelectorAll('thead th i').forEach(i => {
            i.className = 'fas fa-sort text-muted';
        });
        
        // Mettre à jour l'icône actuelle
        icon.className = `fas fa-sort-${ascending ? 'up' : 'down'} text-primary`;
        
        // Trier les lignes
        rows.sort((a, b) => {
            const aText = a.cells[columnIndex].textContent.trim();
            const bText = b.cells[columnIndex].textContent.trim();
            
            // Tentative de tri numérique
            const aNum = parseFloat(aText);
            const bNum = parseFloat(bText);
            
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return ascending ? aNum - bNum : bNum - aNum;
            }
            
            // Tri alphabétique
            const comparison = aText.localeCompare(bText, 'fr', { numeric: true });
            return ascending ? comparison : -comparison;
        });
        
        // Réinsérer les lignes triées
        rows.forEach(row => tbody.appendChild(row));
    },

    // Exporter le tableau en CSV
    exportToCSV(tableId, filename = 'export.csv') {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        const rows = table.querySelectorAll('tr:not([style*="display: none"])');
        const csvContent = Array.from(rows).map(row => {
            const cells = row.querySelectorAll('th, td');
            return Array.from(cells).map(cell => {
                const text = cell.textContent.replace(/"/g, '""');
                return `"${text}"`;
            }).join(',');
        }).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        
        Utils.showToast('Export CSV terminé!', 'success');
    }
};

// Gestionnaire de statistiques et graphiques
const ChartManager = {
    // Couleurs par défaut pour les graphiques
    colors: [
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
        '#fa709a', '#fee140', '#a8edea', '#fed6e3'
    ],

    // Créer un graphique en secteurs
    createPieChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: this.colors.slice(0, data.labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                },
                ...options
            }
        });
    },

    // Créer un graphique en barres
    createBarChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: data.datasets.map((dataset, index) => ({
                    label: dataset.label,
                    data: dataset.data,
                    backgroundColor: this.colors[index] + '80',
                    borderColor: this.colors[index],
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                ...options
            }
        });
    },

    // Créer un graphique linéaire
    createLineChart(canvasId, data, options = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: data.datasets.map((dataset, index) => ({
                    label: dataset.label,
                    data: dataset.data,
                    borderColor: this.colors[index],
                    backgroundColor: this.colors[index] + '20',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.colors[index],
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                ...options
            }
        });
    }
};

// Gestionnaire d'export de données
const ExportManager = {
    // Exporter en Excel
    async exportToExcel(data, filename = 'export.xlsx', sheetName = 'Données') {
        try {
            // Cette fonction nécessiterait une bibliothèque comme SheetJS
            // Pour l'instant, on utilise CSV comme alternative
            this.exportToCSV(data, filename.replace('.xlsx', '.csv'));
            Utils.showToast('Export Excel non disponible, CSV généré à la place', 'warning');
        } catch (error) {
            console.error('Erreur export Excel:', error);
            Utils.showToast('Erreur lors de l\'export Excel', 'error');
        }
    },

    // Exporter en CSV
    exportToCSV(data, filename = 'export.csv') {
        try {
            let csvContent = '';
            
            if (Array.isArray(data) && data.length > 0) {
                // En-têtes
                const headers = Object.keys(data[0]);
                csvContent += headers.map(h => `"${h}"`).join(',') + '\n';
                
                // Données
                data.forEach(row => {
                    const values = headers.map(header => {
                        const value = row[header] || '';
                        return `"${String(value).replace(/"/g, '""')}"`;
                    });
                    csvContent += values.join(',') + '\n';
                });
            }
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            
            Utils.showToast('Export CSV terminé!', 'success');
        } catch (error) {
            console.error('Erreur export CSV:', error);
            Utils.showToast('Erreur lors de l\'export CSV', 'error');
        }
    },

    // Exporter en PDF
    async exportToPDF(elementId, filename = 'export.pdf') {
        try {
            // Cette fonction nécessiterait une bibliothèque comme jsPDF
            Utils.showToast('Export PDF non disponible actuellement', 'warning');
        } catch (error) {
            console.error('Erreur export PDF:', error);
            Utils.showToast('Erreur lors de l\'export PDF', 'error');
        }
    },

    // Imprimer un élément
    printElement(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Impression</title>
                    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                        @media print {
                            .no-print { display: none !important; }
                            body { margin: 0; }
                            .table { font-size: 12px; }
                        }
                    </style>
                </head>
                <body>
                    ${element.outerHTML}
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }
};

// Gestionnaire de cache local
const CacheManager = {
    // Définir une donnée en cache
    set(key, data, expirationMinutes = 60) {
        const item = {
            data: data,
            timestamp: Date.now(),
            expiration: Date.now() + (expirationMinutes * 60 * 1000)
        };
        
        try {
            localStorage.setItem(`app_cache_${key}`, JSON.stringify(item));
        } catch (error) {
            console.warn('Impossible de sauvegarder en cache:', error);
        }
    },

    // Récupérer une donnée du cache
    get(key) {
        try {
            const item = localStorage.getItem(`app_cache_${key}`);
            if (!item) return null;

            const parsed = JSON.parse(item);
            
            // Vérifier l'expiration
            if (Date.now() > parsed.expiration) {
                this.remove(key);
                return null;
            }

            return parsed.data;
        } catch (error) {
            console.warn('Erreur lecture cache:', error);
            return null;
        }
    },

    // Supprimer une donnée du cache
    remove(key) {
        try {
            localStorage.removeItem(`app_cache_${key}`);
        } catch (error) {
            console.warn('Erreur suppression cache:', error);
        }
    },

    // Nettoyer le cache expiré
    cleanup() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('app_cache_')) {
                    const item = JSON.parse(localStorage.getItem(key));
                    if (Date.now() > item.expiration) {
                        localStorage.removeItem(key);
                    }
                }
            });
        } catch (error) {
            console.warn('Erreur nettoyage cache:', error);
        }
    },

    // Vider tout le cache
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('app_cache_')) {
                    localStorage.removeItem(key);
                }
            });
            Utils.showToast('Cache vidé avec succès', 'success');
        } catch (error) {
            console.warn('Erreur vidange cache:', error);
            Utils.showToast('Erreur lors du vidage du cache', 'error');
        }
    }
};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    // Nettoyage du cache au démarrage
    CacheManager.cleanup();

    // Initialisation des tooltips Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialisation des popovers Bootstrap
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Gestion des formulaires avec validation en temps réel
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('input', function(e) {
            if (e.target.hasAttribute('required') || e.target.type === 'email' || e.target.type === 'tel') {
                validateField(e.target);
            }
        });
    });

    // Fonction de validation de champ individuel
    function validateField(field) {
        const value = field.value.trim();
        let isValid = true;

        if (field.hasAttribute('required') && !value) {
            isValid = false;
        } else if (field.type === 'email' && value && !Utils.isValidEmail(value)) {
            isValid = false;
        } else if (field.type === 'tel' && value && !Utils.isValidPhone(value)) {
            isValid = false;
        }

        if (isValid) {
            FormManager.markFieldValid(field);
        } else {
            FormManager.markFieldError(field);
        }
    }

    // Gestion des modales avec réinitialisation automatique
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('hidden.bs.modal', function() {
            const form = this.querySelector('form');
            if (form) {
                form.reset();
                FormManager.resetValidation(form.id);
            }
        });
    });

    // Auto-save pour les formulaires longs
    document.querySelectorAll('[data-autosave]').forEach(form => {
        const saveKey = `autosave_${form.id}`;
        
        // Restaurer les données sauvegardées
        const savedData = CacheManager.get(saveKey);
        if (savedData) {
            FormManager.fillForm(form.id, savedData);
        }

        // Sauvegarder automatiquement
        form.addEventListener('input', Utils.debounce(() => {
            const formData = FormManager.getFormData(form.id);
            CacheManager.set(saveKey, formData, 60); // 1 heure
        }, 2000));

        // Nettoyer après soumission réussie
        form.addEventListener('submit', () => {
            setTimeout(() => {
                CacheManager.remove(saveKey);
            }, 1000);
        });
    });

    // Gestion des raccourcis clavier
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + S pour sauvegarder (empêcher le comportement par défaut)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const activeForm = document.activeElement.closest('form');
            if (activeForm) {
                activeForm.dispatchEvent(new Event('submit'));
            }
        }

        // Échap pour fermer les modales
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                const modalInstance = bootstrap.Modal.getInstance(openModal);
                if (modalInstance) {
                    modalInstance.hide();
                }
            }
        }
    });

    // Lazy loading pour les images
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });

    // Marquage du lien de navigation actif (sidebar + navbar horizontale)
    (function highlightActiveNav() {
        const normalize = (p) => (p || '/').replace(/\/$/, '') || '/';
        const currentPath = normalize(window.location.pathname);
        const selectors = ['.sidebar .nav-link', '.navbar-nav .nav-link'];
        const links = document.querySelectorAll(selectors.join(','));

        links.forEach(link => {
            const href = link.getAttribute('href') || '#';
            const linkPath = normalize((new URL(href, window.location.origin)).pathname);
            const isRoot = linkPath === '/';
            if ((isRoot && currentPath === '/') || linkPath === currentPath || (!isRoot && currentPath.startsWith(linkPath + '/'))) {
                link.classList.add('active');
            }

            link.addEventListener('click', () => {
                document.querySelectorAll(selectors.map(s => `${s}.active`).join(',')).forEach(a => a.classList.remove('active'));
                link.classList.add('active');
            });
        });
    })();
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // Sidebar toggle & responsive behavior
    (function initSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const toggle = document.getElementById('sidebarToggle');
        const collapse = document.getElementById('sidebarCollapse');
        if (!sidebar) return;

        // Restaurer l'état collapsed
        const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (collapsed) sidebar.classList.add('collapsed');

        function openSidebar() {
            sidebar.classList.add('open');
            if (overlay) overlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
        function closeSidebar() {
            sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('open');
            document.body.style.overflow = '';
        }
        if (toggle) toggle.addEventListener('click', () => {
            if (sidebar.classList.contains('open')) closeSidebar(); else openSidebar();
        });
        if (overlay) overlay.addEventListener('click', closeSidebar);
        if (collapse) collapse.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            // Ajuster la flèche
            const icon = collapse.querySelector('i');
            if (icon) icon.classList.toggle('fa-angle-double-right');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
            // Ajuster margin principale
            const main = document.querySelector('.main-content');
            if (main) main.classList.toggle('collapsed', sidebar.classList.contains('collapsed'));
        });

        // Fermer la sidebar si passage en desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 992) {
                closeSidebar();
            }
        });
    })();

    // Animate stat counters
    (function animateStats() {
        document.querySelectorAll('[data-count]').forEach(el => {
            const end = parseInt(el.getAttribute('data-count')) || 0;
            const duration = 800;
            const startTime = performance.now();
            function frame(now) {
                const progress = Math.min((now - startTime) / duration, 1);
                el.textContent = new Intl.NumberFormat('fr-FR').format(Math.floor(progress * end));
                if (progress < 1) requestAnimationFrame(frame);
                else el.textContent = new Intl.NumberFormat('fr-FR').format(end);
            }
            requestAnimationFrame(frame);
        });
    })();

    // Init Chart.js for Recettes & Dépenses (fetch data from server if available)
    (function initRecettesDepensesChart() {
        try {
            if (typeof Chart === 'undefined') return;
            const ctx = document.getElementById('recettesDepensesChart');
            if (!ctx) return;
            const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

            // Helper to create chart once we have data
            function createChart(recettes, depenses) {
                return new Chart(ctx.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels,
                        datasets: [
                            {
                                label: 'Recettes',
                                data: recettes,
                                borderColor: '#3b82f6',
                                backgroundColor: 'rgba(59,130,246,0.12)',
                                tension: 0.3,
                                fill: true,
                                pointRadius: 3
                            },
                            {
                                label: 'Dépenses',
                                data: depenses,
                                borderColor: '#ef4444',
                                backgroundColor: 'rgba(239,68,68,0.12)',
                                tension: 0.3,
                                fill: true,
                                pointRadius: 3
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'top' },
                            tooltip: { mode: 'index', intersect: false }
                        },
                        interaction: { mode: 'nearest', axis: 'x', intersect: false },
                        scales: {
                            y: { beginAtZero: true, ticks: { callback: v => new Intl.NumberFormat('fr-FR').format(v) } }
                        }
                    }
                });
            }

            // Try fetching real data from API endpoint provided by server
            fetch('/api/recettes-depenses')
                .then(res => {
                    if (!res.ok) throw new Error('Network response was not ok');
                    return res.json();
                })
                .then(data => {
                    // Expecting data in shape: { labels?: [...], recettes: [...], depenses: [...] }
                    const serverLabels = Array.isArray(data.labels) && data.labels.length === labels.length ? data.labels : labels;
                    const recettes = Array.isArray(data.recettes) ? data.recettes : [];
                    const depenses = Array.isArray(data.depenses) ? data.depenses : [];

                    // If server didn't provide full arrays, fallback to zeros for missing entries
                    const fillArray = (arr) => labels.map((_, i) => Number.isFinite(arr[i]) ? arr[i] : 0);
                    const r = recettes.length ? fillArray(recettes) : fillArray([]);
                    const d = depenses.length ? fillArray(depenses) : fillArray([]);

                    createChart(r, d);
                })
                .catch(err => {
                    console.warn('Could not fetch recettes/depenses API, falling back to sample data', err);
                    // Fallback example data (kept small & realistic)
                    const recettes = [120000, 150000, 90000, 180000, 160000, 200000, 140000, 170000, 190000, 130000, 110000, 150000];
                    const depenses = [80000, 90000, 60000, 120000, 110000, 130000, 90000, 100000, 95000, 85000, 70000, 90000];
                    createChart(recettes, depenses);
                });
        } catch (e) {
            console.warn('Erreur initialisation Chart.js', e);
        }
    })();

    // Phone inputs: format and validation (10 digits) for inputs with class 'phone-input'
    (function initPhoneInputs() {
        function digitsOnly(str) { return (str || '').replace(/\D/g, ''); }
        function formatPhone(digits) {
            digits = digits.slice(0, 10);
            const parts = [];
            if (digits.length > 0) parts.push(digits.slice(0, 3));
            if (digits.length > 3) parts.push(digits.slice(3, 5));
            if (digits.length > 5) parts.push(digits.slice(5, 8));
            if (digits.length > 8) parts.push(digits.slice(8, 10));
            return parts.join(' ');
        }

        const phoneInputs = Array.from(document.querySelectorAll('.phone-input'));
        phoneInputs.forEach(input => {
            // Initial format
            input.value = formatPhone(digitsOnly(input.value));

            // On input: format and limit
            input.addEventListener('input', function(e) {
                const d = digitsOnly(this.value);
                this.value = formatPhone(d);
            });

            // On paste: sanitize
            input.addEventListener('paste', function(e) {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text');
                const d = digitsOnly(text).slice(0, 10);
                this.value = formatPhone(d);
            });

            // Prevent entering non-digit characters (except navigation keys)
            input.addEventListener('keypress', function(e) {
                const allowed = /[0-9]/;
                if (!allowed.test(String.fromCharCode(e.which || e.keyCode))) {
                    e.preventDefault();
                }
            });
        });

        // Validate phone numbers on form submit
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', function(e) {
                const invalidPhones = [];
                const phones = this.querySelectorAll('.phone-input');
                phones.forEach(p => {
                    const d = digitsOnly(p.value);
                    if (p.required && d.length !== 10) invalidPhones.push(p);
                });
                if (invalidPhones.length) {
                    e.preventDefault();
                    const field = invalidPhones[0];
                    field.focus();
                    Utils.showToast('Veuillez entrer un numéro de téléphone valide de 10 chiffres.', 'error');
                }
            });
        });
    })();

    // Chart initialization
    try {
        const ctx = document.getElementById('revenueChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Revenue',
                        data: [12000, 19000, 3000, 5000, 2000, 3000],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: { mode: 'index', intersect: false }
                    },
                    interaction: { mode: 'nearest', axis: 'x', intersect: false },
                    scales: {
                        y: { beginAtZero: true, ticks: { callback: v => new Intl.NumberFormat('fr-FR').format(v) } }
                    }
                }
            });
        }
    } catch (e) {
        console.warn('Erreur initialisation Chart.js', e);
    }

    // Indicateur de connexion réseau
    function updateOnlineStatus() {
        const status = navigator.onLine;
        if (!status) {
            Utils.showToast('Connexion perdue. Certaines fonctionnalités peuvent être limitées.', 'warning', 5000);
        } else {
            Utils.showToast('Connexion rétablie!', 'success');
        }
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
});

// Ajout des styles CSS pour les toasts
if (!document.querySelector('#toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }

        .toast-notification {
            font-family: inherit;
            font-size: 14px;
        }

        .toast-content {
            display: flex;
            align-items: center;
            flex-grow: 1;
        }

        .toast-close {
            background: none;
            border: none;
            color: #6b7280;
            cursor: pointer;
            padding: 4px;
            margin-left: 12px;
        }

        .toast-close:hover {
            color: #374151;
        }

        .lazy {
            opacity: 0;
            transition: opacity 0.3s;
        }
    `;
    document.head.appendChild(style);
}

// Export des utilitaires pour utilisation globale
window.AppUtils = Utils;
window.AppApi = ApiManager;
window.AppForms = FormManager;
window.AppTables = TableManager;
window.AppCharts = ChartManager;
window.AppExport = ExportManager;
window.AppCache = CacheManager;