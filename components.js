// Enhanced UI Components & Features

// ==================== Search Functionality ====================
class ModeliteSearch {
    constructor() {
        this.searchInput = null;
        this.searchResults = null;
        this.init();
    }

    init() {
        // Create search bar in navbar if doesn't exist
        const navbar = document.querySelector('.navbar .container');
        if (navbar && !document.getElementById('modelite-search')) {
            const searchHTML = `
                <div class="search-container" id="modelite-search">
                    <input type="text" id="searchInput" class="search-input" placeholder="Search models, campaigns...">
                    <div id="searchResults" class="search-results"></div>
                </div>
            `;
            navbar.insertAdjacentHTML('beforeend', searchHTML);
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        const input = document.getElementById('searchInput');
        const results = document.getElementById('searchResults');

        input?.addEventListener('input', (e) => this.performSearch(e.target.value));
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                results.style.display = 'none';
            }
        });
    }

    async performSearch(query) {
        if (query.length < 2) {
            document.getElementById('searchResults').style.display = 'none';
            return;
        }

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            this.displayResults(data);
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    displayResults(data) {
        const resultsDiv = document.getElementById('searchResults');
        let html = '<div class="search-results-content">';

        if (data.models && data.models.length > 0) {
            html += '<div class="search-category"><h4>Models</h4>';
            data.models.forEach(model => {
                html += `<a href="#" onclick="viewModel(${model.id})" class="search-result-item">
                    <span>${model.name}</span>
                    <small>${model.category}</small>
                </a>`;
            });
            html += '</div>';
        }

        if (data.campaigns && data.campaigns.length > 0) {
            html += '<div class="search-category"><h4>Campaigns</h4>';
            data.campaigns.forEach(campaign => {
                html += `<a href="#" onclick="viewCampaign(${campaign.id})" class="search-result-item">
                    <span>${campaign.title}</span>
                    <small>${campaign.client}</small>
                </a>`;
            });
            html += '</div>';
        }

        if (!data.models?.length && !data.campaigns?.length) {
            html += '<p class="no-results">No results found</p>';
        }

        html += '</div>';
        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'block';
    }
}

// ==================== Notifications System ====================
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.container = this.createContainer();
    }

    createContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }

    show(message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="notification-close">&times;</button>
        `;

        this.container.appendChild(notification);

        if (duration > 0) {
            setTimeout(() => notification.remove(), duration);
        }

        return notification;
    }

    success(message) { return this.show(message, 'success'); }
    error(message) { return this.show(message, 'error'); }
    warning(message) { return this.show(message, 'warning'); }
    info(message) { return this.show(message, 'info'); }
}

// ==================== Modal Handler ====================
class ModalHandler {
    static open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    static close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    static closeAll() {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = 'auto';
    }
}

// ==================== Form Utilities ====================
class FormHandler {
    static validate(form) {
        const formData = new FormData(form);
        const errors = [];

        for (let [key, value] of formData) {
            if (!value.trim()) {
                const input = form.querySelector(`[name="${key}"]`);
                if (input?.hasAttribute('required')) {
                    errors.push(`${key} is required`);
                }
            }
        }

        return { isValid: errors.length === 0, errors };
    }

    static getFormData(form) {
        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData) {
            data[key] = value.trim();
        }

        return data;
    }

    static displayErrors(form, errors) {
        // Clear previous errors
        form.querySelectorAll('.form-error').forEach(el => el.remove());

        errors.forEach(error => {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            errorDiv.textContent = error;
            form.appendChild(errorDiv);
        });
    }
}

// ==================== API Helper ====================
class API {
    static async call(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const token = localStorage.getItem('token');
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`/api${endpoint}`, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'API Error');
            }

            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static get(endpoint) { return this.call(endpoint, 'GET'); }
    static post(endpoint, data) { return this.call(endpoint, 'POST', data); }
    static put(endpoint, data) { return this.call(endpoint, 'PUT', data); }
    static delete(endpoint) { return this.call(endpoint, 'DELETE'); }
}

// ==================== Initialize on Page Load ====================
document.addEventListener('DOMContentLoaded', () => {
    window.notificationManager = new NotificationManager();
    new ModeliteSearch();
    
    // Setup modal close handlers
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                ModalHandler.close(modal.id);
            }
        });
    });

    // Setup close buttons
    document.querySelectorAll('.close-btn, .modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                ModalHandler.close(modal.id);
            }
        });
    });
});

// ==================== Global Utilities ====================
window.ModalHandler = ModalHandler;
window.FormHandler = FormHandler;
window.API = API;
