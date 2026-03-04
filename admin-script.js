// Admin Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const ADMIN_KEY = localStorage.getItem('adminKey') || '';

// Check authentication on page load
window.addEventListener('DOMContentLoaded', () => {
    if (!ADMIN_KEY) {
        const key = prompt('Enter Admin Key:');
        if (key) {
            localStorage.setItem('adminKey', key);
            location.reload();
        } else {
            alert('Admin key required');
            window.location.href = 'index.html';
        }
    } else {
        loadDashboard();
    }
});

// Show section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
        document.querySelector(`a[href="#${sectionId}"]`).classList.add('active');
        document.getElementById('page-title').textContent = section.querySelector('h2')?.textContent || 'Dashboard';
    }

    // Load data for the section
    if (sectionId === 'contacts') loadContacts();
    if (sectionId === 'inquiries') loadInquiries();
    if (sectionId === 'models') loadModels();
    if (sectionId === 'campaigns') loadCampaigns();
}

// Load Dashboard
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats?key=${ADMIN_KEY}`);
        const stats = await response.json();

        document.getElementById('stat-models').textContent = stats.total_models || 0;
        document.getElementById('stat-campaigns').textContent = stats.total_campaigns || 0;
        document.getElementById('stat-inquiries').textContent = stats.new_inquiries || 0;
        document.getElementById('stat-contacts').textContent = stats.new_contacts || 0;
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Load Contacts
async function loadContacts() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/contacts?key=${ADMIN_KEY}`);
        const contacts = await response.json();

        const tbody = document.getElementById('contacts-tbody');
        tbody.innerHTML = '';

        if (contacts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No contacts found</td></tr>';
            return;
        }

        contacts.forEach(contact => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${contact.name}</td>
                <td>${contact.email}</td>
                <td>${contact.subject}</td>
                <td>${contact.message.substring(0, 50)}...</td>
                <td><span class="status-badge status-${contact.status}">${contact.status}</span></td>
                <td>${new Date(contact.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-small btn-success" onclick="markAsReplied(${contact.id})">Reply</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

// Load Inquiries
async function loadInquiries() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/inquiries?key=${ADMIN_KEY}`);
        const inquiries = await response.json();

        const tbody = document.getElementById('inquiries-tbody');
        tbody.innerHTML = '';

        if (inquiries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No inquiries found</td></tr>';
            return;
        }

        inquiries.forEach(inquiry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${inquiry.name}</td>
                <td>${inquiry.email}</td>
                <td>${inquiry.phone || 'N/A'}</td>
                <td>${inquiry.inquiry_type || 'N/A'}</td>
                <td>${inquiry.message ? inquiry.message.substring(0, 50) + '...' : 'N/A'}</td>
                <td><span class="status-badge status-${inquiry.status}">${inquiry.status}</span></td>
                <td>${new Date(inquiry.created_at).toLocaleDateString()}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading inquiries:', error);
    }
}

// Load Models
async function loadModels() {
    try {
        const response = await fetch(`${API_BASE_URL}/models`);
        const models = await response.json();

        const container = document.getElementById('models-list');
        container.innerHTML = '';

        if (models.length === 0) {
            container.innerHTML = '<p>No models found</p>';
            return;
        }

        models.forEach(model => {
            const card = document.createElement('div');
            card.className = 'model-card';
            card.innerHTML = `
                <div class="model-photo">👤</div>
                <div class="model-info">
                    <h3>${model.name}</h3>
                    <p><strong>Category:</strong> ${model.category || 'N/A'}</p>
                    <p><strong>Height:</strong> ${model.height || 'N/A'}</p>
                    <p><strong>Email:</strong> ${model.email}</p>
                    <div class="model-actions">
                        <button class="btn btn-small btn-primary" onclick="editModel(${model.id})">Edit</button>
                        <button class="btn btn-small btn-danger" onclick="deleteModel(${model.id})">Delete</button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading models:', error);
    }
}

// Load Campaigns
async function loadCampaigns() {
    try {
        const response = await fetch(`${API_BASE_URL}/campaigns`);
        const campaigns = await response.json();

        const container = document.getElementById('campaigns-list');
        container.innerHTML = '';

        if (campaigns.length === 0) {
            container.innerHTML = '<p>No campaigns found</p>';
            return;
        }

        campaigns.forEach(campaign => {
            const card = document.createElement('div');
            card.className = 'campaign-card';
            card.innerHTML = `
                <h3>${campaign.title}</h3>
                <div class="campaign-meta">
                    <p><strong>Client:</strong> ${campaign.client || 'N/A'}</p>
                    <p><strong>Budget:</strong> $${campaign.budget ? campaign.budget.toFixed(2) : '0.00'}</p>
                    <p><strong>Start:</strong> ${campaign.start_date || 'N/A'}</p>
                    <p><strong>End:</strong> ${campaign.end_date || 'N/A'}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${campaign.status}">${campaign.status}</span></p>
                </div>
                <p>${campaign.description || ''}</p>
                <div class="model-actions">
                    <button class="btn btn-small btn-primary" onclick="viewCampaign(${campaign.id})">View</button>
                    <button class="btn btn-small btn-primary" onclick="assignModel(${campaign.id})">Assign Model</button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading campaigns:', error);
    }
}

// Modal Functions
function openAddModelModal() {
    document.getElementById('addModelModal').classList.add('show');
}

function openAddCampaignModal() {
    document.getElementById('addCampaignModal').classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Submit Add Model
async function submitAddModel(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_BASE_URL}/admin/models?key=${ADMIN_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.success) {
            alert('Model added successfully!');
            form.reset();
            closeModal('addModelModal');
            loadModels();
        } else {
            alert('Error: ' + (result.error || 'Failed to add model'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error adding model');
    }
}

// Submit Add Campaign
async function submitAddCampaign(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_BASE_URL}/admin/campaigns?key=${ADMIN_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.success) {
            alert('Campaign created successfully!');
            form.reset();
            closeModal('addCampaignModal');
            loadCampaigns();
        } else {
            alert('Error: ' + (result.error || 'Failed to create campaign'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error creating campaign');
    }
}

// Mark contact as replied
async function markAsReplied(contactId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/contacts/${contactId}?key=${ADMIN_KEY}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'replied' })
        });

        const result = await response.json();
        if (result.success) {
            loadContacts();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Delete model
async function deleteModel(modelId) {
    if (confirm('Are you sure you want to delete this model?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/models/${modelId}?key=${ADMIN_KEY}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            if (result.success) {
                loadModels();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

// Edit model
function editModel(modelId) {
    alert('Edit functionality coming soon');
}

// View campaign
function viewCampaign(campaignId) {
    alert('View campaign coming soon');
}

// Assign model to campaign
function assignModel(campaignId) {
    alert('Assign model functionality coming soon');
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminKey');
        window.location.href = 'index.html';
    }
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
});
