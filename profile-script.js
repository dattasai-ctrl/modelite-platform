// Profile Script
const API_BASE_URL = 'http://localhost:5000/api';
let currentUserId = null;
let currentToken = null;

window.addEventListener('DOMContentLoaded', () => {
    currentToken = localStorage.getItem('token');
    currentUserId = localStorage.getItem('userId');

    if (!currentToken || !currentUserId) {
        window.location.href = 'auth.html';
        return;
    }

    loadUserProfile();
});

async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/profile/${currentUserId}`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            displayUserProfile(data);
            populateEditForm(data);
            displayPortfolio(data.portfolio);
        } else {
            console.error('Error loading profile:', data.error);
            window.location.href = 'auth.html';
        }
    } catch (error) {
        console.error('Error:', error);
        window.location.href = 'auth.html';
    }
}

function displayUserProfile(user) {
    document.getElementById('profileName').textContent = user.full_name;
    document.getElementById('profileCategory').textContent = user.category || 'Model';
    document.getElementById('portfolioCount').textContent = user.portfolio?.length || 0;

    // Overview tab
    document.getElementById('infoName').textContent = user.full_name;
    document.getElementById('infoEmail').textContent = user.email;
    document.getElementById('infoPhone').textContent = user.phone || '-';
    document.getElementById('infoCategory').textContent = user.category || '-';
    document.getElementById('infoHeight').textContent = user.height || '-';
    document.getElementById('infoWeight').textContent = user.weight ? user.weight + ' lbs' : '-';
    document.getElementById('infoMeasurements').textContent = user.measurements || '-';
    document.getElementById('infoAge').textContent = user.age || '-';
    document.getElementById('infoGender').textContent = user.gender || '-';
    document.getElementById('infoLocation').textContent = user.location || '-';
    document.getElementById('infoHairColor').textContent = user.hair_color || '-';
    document.getElementById('infoEyeColor').textContent = user.eye_color || '-';
    document.getElementById('infoExperience').textContent = user.experience_level || '-';
    document.getElementById('infoLanguages').textContent = user.languages || '-';
    document.getElementById('infoSkills').textContent = user.special_skills || '-';
    document.getElementById('infoBio').textContent = user.bio || '-';
}

function populateEditForm(user) {
    const form = document.getElementById('editProfileForm');
    
    form.querySelector('[name="profile_photo_url"]').value = user.profile_photo_url || '';
    form.querySelector('[name="phone"]').value = user.phone || '';
    form.querySelector('[name="category"]').value = user.category || '';
    form.querySelector('[name="experience_level"]').value = user.experience_level || '';
    form.querySelector('[name="height"]').value = user.height || '';
    form.querySelector('[name="weight"]').value = user.weight || '';
    form.querySelector('[name="age"]').value = user.age || '';
    form.querySelector('[name="gender"]').value = user.gender || '';
    form.querySelector('[name="measurements"]').value = user.measurements || '';
    form.querySelector('[name="hair_color"]').value = user.hair_color || '';
    form.querySelector('[name="eye_color"]').value = user.eye_color || '';
    form.querySelector('[name="location"]').value = user.location || '';
    form.querySelector('[name="languages"]').value = user.languages || '';
    form.querySelector('[name="availability"]').value = user.availability || '';
    form.querySelector('[name="special_skills"]').value = user.special_skills || '';
    form.querySelector('[name="bio"]').value = user.bio || '';
    form.querySelector('[name="portfolio_url"]').value = user.portfolio_url || '';
    form.querySelector('[name="instagram_handle"]').value = user.instagram_handle || '';
    form.querySelector('[name="twitter_handle"]').value = user.twitter_handle || '';
}

function displayPortfolio(portfolio) {
    const container = document.getElementById('portfolioGrid');
    
    if (!portfolio || portfolio.length === 0) {
        container.innerHTML = '<p>No portfolio items yet. Add your first photo!</p>';
        return;
    }

    container.innerHTML = portfolio.map(item => `
        <div class="portfolio-item">
            <div class="portfolio-image">🖼️</div>
            <div class="portfolio-info">
                <h3>${item.title || 'Untitled'}</h3>
                <p>${item.category || ''}</p>
            </div>
        </div>
    `).join('');
}

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active from all buttons
    document.querySelectorAll('.profile-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');

    // Load reviews if reviews tab is opened
    if (tabName === 'reviews') {
        loadUserReviews();
    }
}

// Edit Profile Form
document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_BASE_URL}/users/profile/${currentUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            alert('Profile updated successfully!');
            loadUserProfile();
        } else {
            alert('Error: ' + (result.error || 'Failed to update profile'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error updating profile');
    }
});

// Portfolio Modal
function openPortfolioModal() {
    document.getElementById('portfolioModal').classList.add('show');
}

function closeModal() {
    document.getElementById('portfolioModal').classList.remove('show');
}

async function submitPortfolio(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUserId}/portfolio`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            alert('Photo added to portfolio!');
            event.target.reset();
            closeModal();
            loadUserProfile();
        } else {
            alert('Error: ' + (result.error || 'Failed to add photo'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error adding photo');
    }
}

// Load user reviews
async function loadUserReviews() {
    try {
        // Try to fetch reviews (will fail if endpoint doesn't exist, which is fine)
        try {
            const response = await fetch(`${API_BASE_URL}/reviews/user/${currentUserId}`, {
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });
            
            const container = document.getElementById('reviewsContainer');
            
            if (response.ok) {
                const data = await response.json();
                const reviews = data.reviews || [];
                
                if (reviews.length === 0) {
                    container.innerHTML = '<p class="empty-message">No reviews yet. Great work!</p>';
                } else {
                    container.innerHTML = `
                        <div class="reviews-list">
                            ${reviews.map(review => `
                                <div class="review-item">
                                    <div class="review-header">
                                        <span class="reviewer-name">${review.reviewer_name}</span>
                                        <div class="review-rating">
                                            ${'⭐'.repeat(review.rating)}<span class="rating-value">${review.rating}/5</span>
                                        </div>
                                    </div>
                                    <p class="review-comment">${review.comment}</p>
                                    <small class="review-date">${new Date(review.created_at).toLocaleDateString()}</small>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
            } else {
                document.getElementById('reviewsContainer').innerHTML = '<p>Reviews feature coming soon!</p>';
            }
        } catch (err) {
            document.getElementById('reviewsContainer').innerHTML = '<p>Reviews feature coming soon!</p>';
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        document.getElementById('reviewsContainer').innerHTML = 
            '<p class="error-message">Failed to load reviews</p>';
    }
}

// Logout
async function logout() {
    try {
        await fetch(`${API_BASE_URL}/users/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    window.location.href = 'index.html';
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('portfolioModal');
    if (event.target === modal) {
        closeModal();
    }
});
