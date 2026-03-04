// Auth Script
const API_BASE_URL = 'http://localhost:5000/api';

function switchForm(event) {
    event.preventDefault();
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    const forms = document.querySelectorAll('.auth-form');
    const firstForm = document.getElementById('loginForm').classList.contains('active');
    
    if (firstForm) {
        document.getElementById('registerForm').classList.add('active');
    } else {
        document.getElementById('loginForm').classList.add('active');
    }
}

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userName', data.user.full_name);
            window.location.href = 'profile.html';
        } else {
            alert('Login failed: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Login error. Please try again.');
    }
});

// Register
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name: name, email, password })
        });

        const data = await response.json();
        
        if (data.success) {
            alert('Registration successful! Please log in.');
            document.getElementById('registerForm').reset();
            document.getElementById('registerForm').classList.remove('active');
            document.getElementById('loginForm').classList.add('active');
        } else {
            alert('Registration failed: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Registration error. Please try again.');
    }
});
