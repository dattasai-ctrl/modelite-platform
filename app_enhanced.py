"""
Modelite Backend - Enhanced Version
Features: Advanced search, notifications, reviews, better error handling
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
import hashlib
import secrets
from datetime import datetime, timedelta
import json
from functools import wraps
from typing import Optional, Dict, List, Tuple

app = Flask(__name__)
CORS(app)

# Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
DB_PATH = 'modelite.db'

# ==================== Database Functions ====================
def get_db_connection() -> sqlite3.Connection:
    """Get database connection with row factory"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def dict_from_row(row: sqlite3.Row) -> Dict:
    """Convert sqlite3.Row to dictionary"""
    if row is None:
        return None
    return dict(row)

def init_db():
    """Initialize database with all tables"""
    conn = get_db_connection()
    c = conn.cursor()
    
    # Contacts table
    c.execute('''CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    # Inquiries table
    c.execute('''CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        inquiry_type TEXT,
        message TEXT,
        status TEXT DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    # Models table
    c.execute('''CREATE TABLE IF NOT EXISTS models (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT,
        experience TEXT,
        rate TEXT,
        description TEXT,
        image_url TEXT,
        contact_email TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    # Campaigns table
    c.execute('''CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        budget TEXT,
        deadline TEXT,
        status TEXT DEFAULT 'open',
        required_category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    # Users table
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        phone TEXT,
        bio TEXT,
        profile_image TEXT,
        category TEXT,
        height TEXT,
        measurements TEXT,
        experience TEXT,
        location TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    # User portfolio table
    c.execute('''CREATE TABLE IF NOT EXISTS user_portfolio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        title TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )''')
    
    # User sessions table
    c.execute('''CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )''')
    
    # Campaign applications table
    c.execute('''CREATE TABLE IF NOT EXISTS campaign_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )''')
    
    # Notifications table
    c.execute('''CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT,
        data TEXT,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )''')
    
    # Reviews/Ratings table
    c.execute('''CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reviewer_id INTEGER NOT NULL,
        model_id INTEGER NOT NULL,
        rating REAL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reviewer_id) REFERENCES users (id),
        FOREIGN KEY (model_id) REFERENCES users (id)
    )''')
    
    # Messages table
    c.execute('''CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        recipient_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users (id),
        FOREIGN KEY (recipient_id) REFERENCES users (id)
    )''')
    
    conn.commit()
    conn.close()

# ==================== Security & Auth ====================
def hash_password(password: str) -> str:
    """Hash password with SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    """Generate secure token"""
    return secrets.token_urlsafe(32)

def verify_token(token: str) -> Optional[Dict]:
    """Verify token and return user data"""
    conn = get_db_connection()
    c = conn.cursor()
    
    c.execute('''
        SELECT us.*, u.id as user_id, u.name, u.email
        FROM user_sessions us
        JOIN users u ON us.user_id = u.id
        WHERE us.token = ? AND us.expires_at > ?
    ''', (token, datetime.now()))
    
    session = c.fetchone()
    conn.close()
    
    return dict_from_row(session) if session else None

def token_required(f):
    """Decorator to require token authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token required'}), 401
        
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        user = verify_token(token)
        if not user:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        request.user = user
        return f(*args, **kwargs)
    
    return decorated

# ==================== Health & Status ====================
@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'version': '2.0',
        'timestamp': datetime.now().isoformat()
    })

# ==================== Contact & Inquiry ====================
@app.route('/api/contact', methods=['POST'])
def contact():
    """Submit contact form"""
    try:
        data = request.json
        
        # Validate required fields
        required = ['name', 'email', 'subject', 'message']
        if not all(field in data for field in required):
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            INSERT INTO contacts (name, email, subject, message)
            VALUES (?, ?, ?, ?)
        ''', (data['name'], data['email'], data['subject'], data['message']))
        
        conn.commit()
        contact_id = c.lastrowid
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Contact form submitted successfully',
            'id': contact_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/apply', methods=['POST'])
def apply():
    """Submit model application"""
    try:
        data = request.json
        
        required = ['name', 'email', 'phone']
        if not all(field in data for field in required):
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            INSERT INTO inquiries (name, email, phone, inquiry_type, message)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['name'], data['email'], data['phone'], 
              data.get('inquiry_type', 'model'), data.get('message', '')))
        
        conn.commit()
        inquiry_id = c.lastrowid
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Application submitted successfully',
            'id': inquiry_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== Models & Campaigns ====================
@app.route('/api/models', methods=['GET'])
def get_models():
    """Get all models with optional filtering"""
    try:
        category = request.args.get('category')
        limit = request.args.get('limit', 10, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        conn = get_db_connection()
        c = conn.cursor()
        
        if category:
            c.execute('''
                SELECT * FROM models 
                WHERE category = ? AND status = 'active'
                LIMIT ? OFFSET ?
            ''', (category, limit, offset))
        else:
            c.execute('''
                SELECT * FROM models 
                WHERE status = 'active'
                LIMIT ? OFFSET ?
            ''', (limit, offset))
        
        models = [dict_from_row(row) for row in c.fetchall()]
        conn.close()
        
        return jsonify(models), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/campaigns', methods=['GET'])
def get_campaigns():
    """Get all campaigns with optional filtering"""
    try:
        status = request.args.get('status', 'open')
        limit = request.args.get('limit', 10, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            SELECT * FROM campaigns 
            WHERE status = ?
            LIMIT ? OFFSET ?
        ''', (status, limit, offset))
        
        campaigns = [dict_from_row(row) for row in c.fetchall()]
        conn.close()
        
        return jsonify(campaigns), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== Search & Discover ====================
@app.route('/api/search', methods=['GET'])
def search():
    """Advanced search across models, campaigns, and users"""
    try:
        query = request.args.get('q', '').strip()
        search_type = request.args.get('type', 'all')  # all, models, campaigns, users
        limit = request.args.get('limit', 20, type=int)
        
        if not query or len(query) < 2:
            return jsonify({'error': 'Query too short'}), 400
        
        results = {
            'models': [],
            'campaigns': [],
            'users': []
        }
        
        conn = get_db_connection()
        c = conn.cursor()
        
        search_term = f'%{query}%'
        
        # Search models
        if search_type in ['all', 'models']:
            c.execute('''
                SELECT * FROM models 
                WHERE (name LIKE ? OR category LIKE ? OR description LIKE ?)
                AND status = 'active'
                LIMIT ?
            ''', (search_term, search_term, search_term, limit))
            results['models'] = [dict_from_row(row) for row in c.fetchall()]
        
        # Search campaigns
        if search_type in ['all', 'campaigns']:
            c.execute('''
                SELECT * FROM campaigns 
                WHERE (title LIKE ? OR description LIKE ?)
                AND status = 'open'
                LIMIT ?
            ''', (search_term, search_term, limit))
            results['campaigns'] = [dict_from_row(row) for row in c.fetchall()]
        
        # Search users (models)
        if search_type in ['all', 'users']:
            c.execute('''
                SELECT id, name, category, bio, profile_image 
                FROM users 
                WHERE (name LIKE ? OR category LIKE ? OR bio LIKE ?)
                LIMIT ?
            ''', (search_term, search_term, search_term, limit))
            results['users'] = [dict_from_row(row) for row in c.fetchall()]
        
        conn.close()
        return jsonify(results), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== User Authentication ====================
@app.route('/api/users/register', methods=['POST'])
def register():
    """Register new user"""
    try:
        data = request.json
        
        required = ['name', 'email', 'password']
        if not all(field in data for field in required):
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = get_db_connection()
        c = conn.cursor()
        
        # Check if user exists
        c.execute('SELECT * FROM users WHERE email = ?', (data['email'],))
        if c.fetchone():
            conn.close()
            return jsonify({'error': 'Email already registered'}), 409
        
        # Create user
        hashed_password = hash_password(data['password'])
        c.execute('''
            INSERT INTO users (name, email, password, phone, category, bio)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (data['name'], data['email'], hashed_password,
              data.get('phone', ''), data.get('category', 'Model'),
              data.get('bio', '')))
        
        conn.commit()
        user_id = c.lastrowid
        
        # Create session
        token = generate_token()
        expires = datetime.now() + timedelta(days=30)
        
        c.execute('''
            INSERT INTO user_sessions (user_id, token, expires_at)
            VALUES (?, ?, ?)
        ''', (user_id, token, expires))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user_id': user_id,
            'token': token
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.json
        
        if 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email and password required'}), 400
        
        conn = get_db_connection()
        c = conn.cursor()
        
        # Find user
        c.execute('SELECT * FROM users WHERE email = ?', (data['email'],))
        user = c.fetchone()
        
        if not user or user['password'] != hash_password(data['password']):
            conn.close()
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Create session
        token = generate_token()
        expires = datetime.now() + timedelta(days=30)
        
        c.execute('''
            INSERT INTO user_sessions (user_id, token, expires_at)
            VALUES (?, ?, ?)
        ''', (user['id'], token, expires))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user_id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'token': token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== User Profile ====================
@app.route('/api/users/profile/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    """Get user profile"""
    try:
        conn = get_db_connection()
        c = conn.cursor()
        
        # Get user
        c.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        user = dict_from_row(c.fetchone())
        
        if not user:
            conn.close()
            return jsonify({'error': 'User not found'}), 404
        
        # Remove password
        user.pop('password', None)
        
        # Get portfolio
        c.execute('SELECT * FROM user_portfolio WHERE user_id = ?', (user_id,))
        user['portfolio'] = [dict_from_row(row) for row in c.fetchall()]
        
        # Get reviews
        c.execute('SELECT * FROM reviews WHERE model_id = ?', (user_id,))
        user['reviews'] = [dict_from_row(row) for row in c.fetchall()]
        
        conn.close()
        return jsonify(user), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/profile/<int:user_id>', methods=['PUT'])
@token_required
def update_profile(user_id):
    """Update user profile"""
    try:
        # Check authorization
        if request.user['user_id'] != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.json
        
        conn = get_db_connection()
        c = conn.cursor()
        
        # Build update query dynamically
        allowed_fields = ['name', 'phone', 'bio', 'category', 'height', 
                         'measurements', 'experience', 'location', 'profile_image']
        
        updates = []
        values = []
        
        for field in allowed_fields:
            if field in data:
                updates.append(f'{field} = ?')
                values.append(data[field])
        
        if not updates:
            conn.close()
            return jsonify({'error': 'No fields to update'}), 400
        
        updates.append('updated_at = ?')
        values.append(datetime.now())
        values.append(user_id)
        
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
        c.execute(query, values)
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== Notifications ====================
@app.route('/api/notifications', methods=['GET'])
@token_required
def get_notifications():
    """Get user notifications"""
    try:
        user_id = request.user['user_id']
        limit = request.args.get('limit', 20, type=int)
        
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            SELECT * FROM notifications 
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        ''', (user_id, limit))
        
        notifications = [dict_from_row(row) for row in c.fetchall()]
        conn.close()
        
        return jsonify(notifications), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/notifications/<int:notification_id>', methods=['PUT'])
@token_required
def mark_notification_read(notification_id):
    """Mark notification as read"""
    try:
        user_id = request.user['user_id']
        
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            UPDATE notifications 
            SET is_read = 1 
            WHERE id = ? AND user_id = ?
        ''', (notification_id, user_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== Reviews & Ratings ====================
@app.route('/api/reviews', methods=['POST'])
@token_required
def add_review():
    """Add review for a model"""
    try:
        data = request.json
        reviewer_id = request.user['user_id']
        
        if 'model_id' not in data or 'rating' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            INSERT INTO reviews (reviewer_id, model_id, rating, comment)
            VALUES (?, ?, ?, ?)
        ''', (reviewer_id, data['model_id'], data['rating'], 
              data.get('comment', '')))
        
        conn.commit()
        review_id = c.lastrowid
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Review added successfully',
            'id': review_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== Messaging ====================
@app.route('/api/messages', methods=['POST'])
@token_required
def send_message():
    """Send message to another user"""
    try:
        data = request.json
        sender_id = request.user['user_id']
        
        if 'recipient_id' not in data or 'message' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            INSERT INTO messages (sender_id, recipient_id, message)
            VALUES (?, ?, ?)
        ''', (sender_id, data['recipient_id'], data['message']))
        
        conn.commit()
        message_id = c.lastrowid
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Message sent successfully',
            'id': message_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/messages/<int:other_user_id>', methods=['GET'])
@token_required
def get_messages(other_user_id):
    """Get conversation with another user"""
    try:
        user_id = request.user['user_id']
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        conn = get_db_connection()
        c = conn.cursor()
        
        c.execute('''
            SELECT * FROM messages 
            WHERE (sender_id = ? AND recipient_id = ?) 
               OR (sender_id = ? AND recipient_id = ?)
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ''', (user_id, other_user_id, other_user_id, user_id, limit, offset))
        
        messages = [dict_from_row(row) for row in c.fetchall()]
        conn.close()
        
        return jsonify(messages), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== Campaign Applications ====================
@app.route('/api/campaigns/<int:campaign_id>/apply', methods=['POST'])
@token_required
def apply_to_campaign(campaign_id):
    """Apply for a campaign"""
    try:
        user_id = request.user['user_id']
        
        conn = get_db_connection()
        c = conn.cursor()
        
        # Check if already applied
        c.execute('''
            SELECT * FROM campaign_applications 
            WHERE campaign_id = ? AND user_id = ?
        ''', (campaign_id, user_id))
        
        if c.fetchone():
            conn.close()
            return jsonify({'error': 'Already applied to this campaign'}), 409
        
        # Add application
        c.execute('''
            INSERT INTO campaign_applications (campaign_id, user_id)
            VALUES (?, ?)
        ''', (campaign_id, user_id))
        
        conn.commit()
        app_id = c.lastrowid
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Application submitted successfully',
            'id': app_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== Static Files ====================
@app.route('/', methods=['GET'])
def index():
    """Serve index.html"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>', methods=['GET'])
def serve_static(path):
    """Serve static files"""
    if os.path.isfile(path):
        return send_from_directory('.', path)
    return send_from_directory('.', 'index.html')

# ==================== Error Handlers ====================
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

# ==================== Main ====================
if __name__ == '__main__':
    print("Starting Modelite server on http://localhost:5000")
    init_db()
    app.run(debug=True, port=5000)
