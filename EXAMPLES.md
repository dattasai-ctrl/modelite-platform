# Modelite - Advanced Usage Examples

## 🔧 Component Examples

### 1. Search Implementation

#### HTML
```html
<div class="search-container">
    <input type="text" id="globalSearch" class="search-input" 
           placeholder="Search models, campaigns...">
    <div id="searchResults" class="search-results"></div>
</div>
```

#### JavaScript
```javascript
// Automatically initialized as window.modeliteSearch
const search = window.modeliteSearch;

// Perform manual search
async function searchModels(query) {
    try {
        const results = await api.get(`/api/search?q=${query}&type=models`);
        console.log('Models found:', results.models);
    } catch (error) {
        notifications.show('Search failed: ' + error.message, 'error');
    }
}
```

### 2. Notification System

#### Toast Notifications
```javascript
// Show success notification
notifications.show('Profile updated!', 'success');

// Show error notification
notifications.show('Failed to update profile', 'error');

// Show warning notification
notifications.show('This action cannot be undone', 'warning');

// Show info notification
notifications.show('New campaign available', 'info');
```

#### In Forms
```javascript
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value
    };
    
    try {
        const response = await api.post('/api/contact', formData);
        notifications.show('Message sent successfully!', 'success');
        contactForm.reset();
    } catch (error) {
        notifications.show('Error sending message', 'error');
    }
});
```

### 3. Modal Management

#### HTML
```html
<div class="modal" id="editProfileModal">
    <div class="modal-content">
        <h2>Edit Profile</h2>
        <form id="editForm">
            <input type="text" id="bio" placeholder="Bio">
            <button type="submit">Save</button>
        </form>
    </div>
</div>
```

#### JavaScript
```javascript
const modal = new ModalHandler('#editProfileModal');

// Open modal
document.getElementById('editBtn').addEventListener('click', () => {
    modal.open();
});

// Close on cancel
document.getElementById('cancelBtn').addEventListener('click', () => {
    modal.close();
});

// Handle form submission
document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const bioText = document.getElementById('bio').value;
    
    try {
        await api.put('/api/users/profile/1', { bio: bioText });
        notifications.show('Profile updated!', 'success');
        modal.close();
    } catch (error) {
        notifications.show('Update failed', 'error');
    }
});
```

### 4. Form Validation

#### HTML
```html
<form id="registrationForm">
    <div class="form-group">
        <label>Email *</label>
        <input type="email" name="email" required>
        <span class="error-message"></span>
    </div>
    <div class="form-group">
        <label>Password *</label>
        <input type="password" name="password" required>
        <span class="error-message"></span>
    </div>
    <button type="submit" class="btn btn-primary">Register</button>
</form>
```

#### JavaScript
```javascript
const form = new FormHandler('#registrationForm');

document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    form.clearErrors();
    
    const email = document.querySelector('[name="email"]').value;
    const password = document.querySelector('[name="password"]').value;
    
    // Validate
    if (!email || !password) {
        form.showError('email', 'Email is required');
        form.showError('password', 'Password is required');
        return;
    }
    
    if (password.length < 6) {
        form.showError('password', 'Password must be at least 6 characters');
        return;
    }
    
    try {
        const result = await api.post('/api/users/register', {
            name: 'User',
            email: email,
            password: password
        });
        
        localStorage.setItem('token', result.token);
        notifications.show('Registration successful!', 'success');
        window.location.href = '/profile.html';
    } catch (error) {
        notifications.show('Registration failed: ' + error.message, 'error');
    }
});
```

### 5. API Calls with Authentication

#### GET Request
```javascript
async function getProfile(userId) {
    try {
        const profile = await api.get(`/api/users/profile/${userId}`);
        console.log('Profile:', profile);
        return profile;
    } catch (error) {
        console.error('Failed to fetch profile:', error);
        notifications.show('Failed to load profile', 'error');
    }
}
```

#### POST Request
```javascript
async function createReview(modelId, rating, comment) {
    try {
        const review = await api.post('/api/reviews', {
            model_id: modelId,
            rating: rating,
            comment: comment
        });
        
        notifications.show('Review added successfully!', 'success');
        return review;
    } catch (error) {
        notifications.show('Failed to add review', 'error');
    }
}
```

#### PUT Request
```javascript
async function updateProfile(userId, updates) {
    try {
        const result = await api.put(`/api/users/profile/${userId}`, updates);
        notifications.show('Profile updated!', 'success');
        return result;
    } catch (error) {
        notifications.show('Update failed', 'error');
    }
}
```

#### DELETE Request
```javascript
async function deleteNotification(notificationId) {
    try {
        await api.delete(`/api/notifications/${notificationId}`);
        notifications.show('Notification deleted', 'info');
    } catch (error) {
        notifications.show('Failed to delete', 'error');
    }
}
```

## 📊 Advanced Features

### Search with Filters

#### HTML
```html
<div class="search-section">
    <input type="text" id="modelSearch" placeholder="Search models...">
    <select id="categoryFilter">
        <option value="">All Categories</option>
        <option value="runway">Runway</option>
        <option value="commercial">Commercial</option>
        <option value="editorial">Editorial</option>
    </select>
    <div id="searchResults"></div>
</div>
```

#### JavaScript
```javascript
let searchTimeout;

document.getElementById('modelSearch').addEventListener('input', (e) => {
    const query = e.target.value;
    const category = document.getElementById('categoryFilter').value;
    
    // Debounce search
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        if (query.length < 2) return;
        
        try {
            const results = await api.get(
                `/api/search?q=${query}&type=models&category=${category}`
            );
            
            displaySearchResults(results);
        } catch (error) {
            notifications.show('Search error', 'error');
        }
    }, 300);
});

function displaySearchResults(results) {
    const container = document.getElementById('searchResults');
    
    if (results.length === 0) {
        container.innerHTML = '<p class="no-results">No models found</p>';
        return;
    }
    
    container.innerHTML = results.map(model => `
        <div class="search-result-item">
            <div>
                <strong>${model.name}</strong>
                <small>${model.category}</small>
            </div>
            <a href="#" onclick="viewProfile(${model.id})" class="btn-small">View</a>
        </div>
    `).join('');
}
```

### Campaign Application Flow

#### HTML
```html
<div class="campaign-card">
    <h3 id="campaignTitle">Campaign Title</h3>
    <p id="campaignDescription">Description...</p>
    <button class="btn btn-primary" onclick="applyCampaign()">Apply Now</button>
</div>
```

#### JavaScript
```javascript
async function applyCampaign(campaignId) {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        notifications.show('Please login first', 'warning');
        window.location.href = '/auth.html';
        return;
    }
    
    // Show confirmation
    const confirm = window.confirm('Apply for this campaign?');
    if (!confirm) return;
    
    // Show loading state
    Modelite.showLoader();
    
    try {
        const result = await api.post(`/api/campaigns/${campaignId}/apply`);
        
        Modelite.hideLoader();
        notifications.show('Application submitted! Good luck!', 'success');
        
        // Update button state
        document.querySelector('button').disabled = true;
        document.querySelector('button').textContent = 'Applied ✓';
        
    } catch (error) {
        Modelite.hideLoader();
        if (error.status === 409) {
            notifications.show('You already applied for this campaign', 'warning');
        } else {
            notifications.show('Failed to apply: ' + error.message, 'error');
        }
    }
}
```

### Messaging System

#### HTML
```html
<div class="messages-container">
    <div class="messages-list" id="messagesList"></div>
    <form id="messageForm" class="message-form">
        <textarea id="messageText" placeholder="Type message..." required></textarea>
        <button type="submit" class="btn btn-primary">Send</button>
    </form>
</div>
```

#### JavaScript
```javascript
let currentConversation = null;

async function loadMessages(userId) {
    currentConversation = userId;
    
    try {
        const messages = await api.get(`/api/messages/${userId}`);
        
        const container = document.getElementById('messagesList');
        container.innerHTML = messages.map(msg => `
            <div class="message ${msg.sender_id === getCurrentUserId() ? 'sent' : 'received'}">
                <p>${msg.message}</p>
                <small>${Modelite.formatDate(msg.created_at)}</small>
            </div>
        `).join('');
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
        
    } catch (error) {
        notifications.show('Failed to load messages', 'error');
    }
}

document.getElementById('messageForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const messageText = document.getElementById('messageText').value;
    
    if (!messageText.trim()) return;
    
    try {
        await api.post('/api/messages', {
            recipient_id: currentConversation,
            message: messageText
        });
        
        document.getElementById('messageText').value = '';
        await loadMessages(currentConversation);
        
    } catch (error) {
        notifications.show('Failed to send message', 'error');
    }
});

function getCurrentUserId() {
    // Get from session/token
    return localStorage.getItem('user_id');
}
```

### Profile Management

#### HTML
```html
<div class="profile-edit">
    <form id="profileForm">
        <div class="form-group">
            <label>Bio</label>
            <textarea id="bio" name="bio"></textarea>
        </div>
        <div class="form-group">
            <label>Height</label>
            <input type="text" id="height" name="height">
        </div>
        <div class="form-group">
            <label>Measurements</label>
            <input type="text" id="measurements" name="measurements" 
                   placeholder="e.g., 32-24-34">
        </div>
        <button type="submit" class="btn btn-primary">Save Changes</button>
    </form>
</div>
```

#### JavaScript
```javascript
async function loadProfile(userId) {
    try {
        const profile = await api.get(`/api/users/profile/${userId}`);
        
        document.getElementById('bio').value = profile.bio || '';
        document.getElementById('height').value = profile.height || '';
        document.getElementById('measurements').value = profile.measurements || '';
        
    } catch (error) {
        notifications.show('Failed to load profile', 'error');
    }
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const updates = {
        bio: document.getElementById('bio').value,
        height: document.getElementById('height').value,
        measurements: document.getElementById('measurements').value
    };
    
    try {
        await updateProfile(getCurrentUserId(), updates);
        notifications.show('Profile updated successfully!', 'success');
    } catch (error) {
        notifications.show('Failed to update profile', 'error');
    }
});
```

## 🎨 CSS Utilities

### Quick Layout Examples

#### Centered Card
```html
<div class="card flex flex-center">
    <div class="text-center p-4">
        <h2>Your Content</h2>
    </div>
</div>
```

#### Responsive Grid
```html
<div class="grid-3 gap-2">
    <div class="card">Item 1</div>
    <div class="card">Item 2</div>
    <div class="card">Item 3</div>
</div>
```

#### Button Group
```html
<div class="flex gap-2">
    <button class="btn btn-primary">Primary</button>
    <button class="btn btn-secondary">Secondary</button>
</div>
```

#### Status Badges
```html
<div class="flex gap-1">
    <span class="badge badge-success">Active</span>
    <span class="badge badge-warning">Pending</span>
    <span class="badge badge-danger">Rejected</span>
</div>
```

## 🔒 Security Examples

### Token Management
```javascript
// Save token on login
async function login(email, password) {
    const result = await api.post('/api/users/login', {
        email: email,
        password: password
    });
    
    localStorage.setItem('token', result.token);
    localStorage.setItem('user_id', result.user_id);
    
    return result;
}

// Clear token on logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    window.location.href = '/auth.html';
}

// Check if logged in
function isLoggedIn() {
    return !!localStorage.getItem('token');
}
```

### Protecting Pages
```javascript
// At top of profile.html
if (!isLoggedIn()) {
    window.location.href = '/auth.html';
}
```

---

**Happy coding with Modelite!** 🚀
