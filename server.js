const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Database Setup
const db = new sqlite3.Database(path.join(__dirname, 'modelite.db'), (err) => {
    if (err) console.error('Database error:', err);
    else console.log('Connected to SQLite database');
});

// Create tables if they don't exist
db.serialize(() => {
    // Contacts table
    db.run(`
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'new',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Model inquiries/applications
    db.run(`
        CREATE TABLE IF NOT EXISTS inquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            inquiry_type TEXT,
            message TEXT,
            status TEXT DEFAULT 'new',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Models portfolio
    db.run(`
        CREATE TABLE IF NOT EXISTS models (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            category TEXT,
            height TEXT,
            measurements TEXT,
            bio TEXT,
            portfolio_url TEXT,
            photo_url TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Campaigns/Projects
    db.run(`
        CREATE TABLE IF NOT EXISTS campaigns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            client TEXT,
            budget REAL,
            status TEXT DEFAULT 'active',
            start_date DATE,
            end_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Model-Campaign assignments
    db.run(`
        CREATE TABLE IF NOT EXISTS model_campaigns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model_id INTEGER NOT NULL,
            campaign_id INTEGER NOT NULL,
            role TEXT,
            compensation REAL,
            status TEXT DEFAULT 'assigned',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (model_id) REFERENCES models(id),
            FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
        )
    `);

    // Statistics
    db.run(`
        CREATE TABLE IF NOT EXISTS statistics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            total_models INTEGER,
            total_campaigns INTEGER,
            total_inquiries INTEGER,
            total_contacts INTEGER,
            date DATE UNIQUE,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // User Profiles (Models creating accounts)
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            phone TEXT,
            profile_photo_url TEXT,
            bio TEXT,
            category TEXT,
            height TEXT,
            weight TEXT,
            measurements TEXT,
            hair_color TEXT,
            eye_color TEXT,
            experience_level TEXT,
            portfolio_url TEXT,
            instagram_handle TEXT,
            twitter_handle TEXT,
            location TEXT,
            age INTEGER,
            gender TEXT,
            languages TEXT,
            special_skills TEXT,
            availability TEXT,
            verified BOOLEAN DEFAULT 0,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // User Sessions/Tokens
    db.run(`
        CREATE TABLE IF NOT EXISTS user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // User Portfolio Images
    db.run(`
        CREATE TABLE IF NOT EXISTS user_portfolio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            image_url TEXT NOT NULL,
            title TEXT,
            description TEXT,
            category TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // User Applications
    db.run(`
        CREATE TABLE IF NOT EXISTS user_applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            campaign_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
        )
    `);
});

// Email Configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
    }
});

// Utility function to generate token
function generateToken() {
    return require('crypto').randomBytes(32).toString('hex');
}

// Utility function to hash password (basic - use bcrypt in production)
function hashPassword(password) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Contact Form Submission
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Save to database
        db.run(
            'INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)',
            [name, email, subject, message],
            async function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to save message' });
                }

                // Send email notification
                try {
                    await transporter.sendMail({
                        from: process.env.SMTP_USER || 'noreply@modelite.com',
                        to: process.env.ADMIN_EMAIL || 'info@modelite.com',
                        subject: `New Contact Form: ${subject}`,
                        html: `
                            <h2>New Contact Form Submission</h2>
                            <p><strong>Name:</strong> ${name}</p>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Subject:</strong> ${subject}</p>
                            <p><strong>Message:</strong></p>
                            <p>${message.replace(/\n/g, '<br>')}</p>
                        `
                    });

                    // Send confirmation to user
                    await transporter.sendMail({
                        from: process.env.SMTP_USER || 'noreply@modelite.com',
                        to: email,
                        subject: 'We received your message - Modelite',
                        html: `
                            <h2>Thank You!</h2>
                            <p>Hi ${name},</p>
                            <p>We have received your message and will get back to you shortly.</p>
                            <p>Best regards,<br>The Modelite Team</p>
                        `
                    });

                    res.json({ 
                        success: true, 
                        message: 'Message sent successfully!',
                        id: this.lastID 
                    });
                } catch (emailErr) {
                    console.error('Email error:', emailErr);
                    res.json({ 
                        success: true, 
                        message: 'Message saved successfully!',
                        id: this.lastID 
                    });
                }
            }
        );
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Model Inquiry Submission
app.post('/api/apply', async (req, res) => {
    const { name, email, phone, inquiryType, message } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    try {
        db.run(
            'INSERT INTO inquiries (name, email, phone, inquiry_type, message) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, inquiryType, message],
            async function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to save application' });
                }

                try {
                    await transporter.sendMail({
                        from: process.env.SMTP_USER || 'noreply@modelite.com',
                        to: process.env.ADMIN_EMAIL || 'info@modelite.com',
                        subject: `New Model Application: ${name}`,
                        html: `
                            <h2>New Model Application</h2>
                            <p><strong>Name:</strong> ${name}</p>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                            <p><strong>Type:</strong> ${inquiryType || 'Not specified'}</p>
                            <p><strong>Message:</strong></p>
                            <p>${message.replace(/\n/g, '<br>')}</p>
                        `
                    });

                    res.json({ 
                        success: true, 
                        message: 'Application submitted successfully!',
                        id: this.lastID 
                    });
                } catch (emailErr) {
                    console.error('Email error:', emailErr);
                    res.json({ 
                        success: true, 
                        message: 'Application saved successfully!',
                        id: this.lastID 
                    });
                }
            }
        );
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all contacts (admin endpoint)
app.get('/api/admin/contacts', (req, res) => {
    const adminKey = req.query.key;
    
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    db.all('SELECT * FROM contacts ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to retrieve contacts' });
        }
        res.json(rows);
    });
});

// Get all inquiries (admin endpoint)
app.get('/api/admin/inquiries', (req, res) => {
    const adminKey = req.query.key;
    
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    db.all('SELECT * FROM inquiries ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to retrieve inquiries' });
        }
        res.json(rows);
    });
});

// Models Management Endpoints

// Get all models
app.get('/api/models', (req, res) => {
    db.all('SELECT * FROM models WHERE status = ? ORDER BY created_at DESC', ['active'], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to retrieve models' });
        }
        res.json(rows);
    });
});

// Get single model
app.get('/api/models/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM models WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to retrieve model' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Model not found' });
        }
        res.json(row);
    });
});

// Add new model (admin)
app.post('/api/admin/models', (req, res) => {
    const adminKey = req.query.key;
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const { name, email, phone, category, height, measurements, bio, portfolio_url, photo_url } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    db.run(
        'INSERT INTO models (name, email, phone, category, height, measurements, bio, portfolio_url, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email, phone, category, height, measurements, bio, portfolio_url, photo_url],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to add model' });
            }
            res.json({ success: true, id: this.lastID });
        }
    );
});

// Update model (admin)
app.put('/api/admin/models/:id', (req, res) => {
    const adminKey = req.query.key;
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { name, email, phone, category, height, measurements, bio, portfolio_url, photo_url, status } = req.body;

    db.run(
        'UPDATE models SET name=?, email=?, phone=?, category=?, height=?, measurements=?, bio=?, portfolio_url=?, photo_url=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
        [name, email, phone, category, height, measurements, bio, portfolio_url, photo_url, status, id],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to update model' });
            }
            res.json({ success: true, message: 'Model updated' });
        }
    );
});

// Delete model (admin)
app.delete('/api/admin/models/:id', (req, res) => {
    const adminKey = req.query.key;
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    db.run('UPDATE models SET status=? WHERE id=?', ['inactive', id], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to delete model' });
        }
        res.json({ success: true, message: 'Model deleted' });
    });
});

// Campaigns Management

// Get all campaigns
app.get('/api/campaigns', (req, res) => {
    db.all('SELECT * FROM campaigns WHERE status = ? ORDER BY created_at DESC', ['active'], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to retrieve campaigns' });
        }
        res.json(rows);
    });
});

// Get campaign with assigned models
app.get('/api/campaigns/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM campaigns WHERE id = ?', [id], (err, campaign) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to retrieve campaign' });
        }
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        db.all('SELECT m.*, mc.role, mc.compensation FROM models m JOIN model_campaigns mc ON m.id = mc.model_id WHERE mc.campaign_id = ?', [id], (err, models) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to retrieve models' });
            }
            res.json({ ...campaign, assigned_models: models || [] });
        });
    });
});

// Add campaign (admin)
app.post('/api/admin/campaigns', (req, res) => {
    const adminKey = req.query.key;
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const { title, description, client, budget, start_date, end_date } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    db.run(
        'INSERT INTO campaigns (title, description, client, budget, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
        [title, description, client, budget, start_date, end_date],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to add campaign' });
            }
            res.json({ success: true, id: this.lastID });
        }
    );
});

// Assign model to campaign (admin)
app.post('/api/admin/campaigns/:campaignId/assign-model', (req, res) => {
    const adminKey = req.query.key;
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const { campaignId } = req.params;
    const { model_id, role, compensation } = req.body;

    db.run(
        'INSERT INTO model_campaigns (model_id, campaign_id, role, compensation) VALUES (?, ?, ?, ?)',
        [model_id, campaignId, role, compensation],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to assign model' });
            }
            res.json({ success: true, id: this.lastID });
        }
    );
});

// Update contact status (admin)
app.put('/api/admin/contacts/:id', (req, res) => {
    const adminKey = req.query.key;
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { status } = req.body;

    db.run(
        'UPDATE contacts SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
        [status, id],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to update contact' });
            }
            res.json({ success: true, message: 'Contact updated' });
        }
    );
});

// Get dashboard statistics (admin)
app.get('/api/admin/stats', (req, res) => {
    const adminKey = req.query.key;
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    Promise.all([
        new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM models WHERE status = ?', ['active'], (err, row) => {
                if (err) reject(err);
                resolve(row?.count || 0);
            });
        }),
        new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM campaigns WHERE status = ?', ['active'], (err, row) => {
                if (err) reject(err);
                resolve(row?.count || 0);
            });
        }),
        new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM inquiries WHERE status = ?', ['new'], (err, row) => {
                if (err) reject(err);
                resolve(row?.count || 0);
            });
        }),
        new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM contacts WHERE status = ?', ['new'], (err, row) => {
                if (err) reject(err);
                resolve(row?.count || 0);
            });
        })
    ]).then(([models, campaigns, inquiries, contacts]) => {
        res.json({
            total_models: models,
            total_campaigns: campaigns,
            new_inquiries: inquiries,
            new_contacts: contacts,
            timestamp: new Date().toISOString()
        });
    }).catch(err => {
        console.error('Statistics error:', err);
        res.status(500).json({ error: 'Failed to retrieve statistics' });
    });
});

// User Profile Endpoints

// Register new user
app.post('/api/users/register', async (req, res) => {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const hashedPassword = hashPassword(password);

    db.run(
        'INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)',
        [email, hashedPassword, full_name],
        async function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Email already registered' });
                }
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to register user' });
            }

            // Send welcome email
            try {
                await transporter.sendMail({
                    from: process.env.SMTP_USER || 'noreply@modelite.com',
                    to: email,
                    subject: 'Welcome to Modelite!',
                    html: `
                        <h2>Welcome to Modelite!</h2>
                        <p>Hi ${full_name},</p>
                        <p>Your account has been created successfully. You can now log in and start building your modeling portfolio.</p>
                        <p>Best regards,<br>The Modelite Team</p>
                    `
                });
            } catch (emailErr) {
                console.error('Email error:', emailErr);
            }

            res.json({ success: true, message: 'Registration successful!', userId: this.lastID });
        }
    );
});

// Login user
app.post('/api/users/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const hashedPassword = hashPassword(password);

    db.get(
        'SELECT id, email, full_name FROM users WHERE email = ? AND password = ?',
        [email, hashedPassword],
        (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Login failed' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const token = generateToken();
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

            db.run(
                'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
                [user.id, token, expiresAt.toISOString()],
                (err) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Session creation failed' });
                    }

                    res.json({
                        success: true,
                        message: 'Login successful!',
                        token: token,
                        user: {
                            id: user.id,
                            email: user.email,
                            full_name: user.full_name
                        }
                    });
                }
            );
        }
    );
});

// Get user profile
app.get('/api/users/profile/:userId', (req, res) => {
    const { userId } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    db.get(
        'SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime("now")',
        [token],
        (err, session) => {
            if (err || !session) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }

            if (session.user_id != userId) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to retrieve profile' });
                }

                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }

                // Get portfolio images
                db.all('SELECT * FROM user_portfolio WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, portfolio) => {
                    res.json({
                        ...user,
                        portfolio: portfolio || []
                    });
                });
            });
        }
    );
});

// Update user profile
app.put('/api/users/profile/:userId', (req, res) => {
    const { userId } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    db.get(
        'SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime("now")',
        [token],
        (err, session) => {
            if (err || !session) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }

            if (session.user_id != userId) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            const {
                phone, profile_photo_url, bio, category, height, weight, measurements,
                hair_color, eye_color, experience_level, portfolio_url, instagram_handle,
                twitter_handle, location, age, gender, languages, special_skills, availability
            } = req.body;

            const updateFields = [];
            const updateValues = [];

            if (phone !== undefined) { updateFields.push('phone = ?'); updateValues.push(phone); }
            if (profile_photo_url !== undefined) { updateFields.push('profile_photo_url = ?'); updateValues.push(profile_photo_url); }
            if (bio !== undefined) { updateFields.push('bio = ?'); updateValues.push(bio); }
            if (category !== undefined) { updateFields.push('category = ?'); updateValues.push(category); }
            if (height !== undefined) { updateFields.push('height = ?'); updateValues.push(height); }
            if (weight !== undefined) { updateFields.push('weight = ?'); updateValues.push(weight); }
            if (measurements !== undefined) { updateFields.push('measurements = ?'); updateValues.push(measurements); }
            if (hair_color !== undefined) { updateFields.push('hair_color = ?'); updateValues.push(hair_color); }
            if (eye_color !== undefined) { updateFields.push('eye_color = ?'); updateValues.push(eye_color); }
            if (experience_level !== undefined) { updateFields.push('experience_level = ?'); updateValues.push(experience_level); }
            if (portfolio_url !== undefined) { updateFields.push('portfolio_url = ?'); updateValues.push(portfolio_url); }
            if (instagram_handle !== undefined) { updateFields.push('instagram_handle = ?'); updateValues.push(instagram_handle); }
            if (twitter_handle !== undefined) { updateFields.push('twitter_handle = ?'); updateValues.push(twitter_handle); }
            if (location !== undefined) { updateFields.push('location = ?'); updateValues.push(location); }
            if (age !== undefined) { updateFields.push('age = ?'); updateValues.push(age); }
            if (gender !== undefined) { updateFields.push('gender = ?'); updateValues.push(gender); }
            if (languages !== undefined) { updateFields.push('languages = ?'); updateValues.push(languages); }
            if (special_skills !== undefined) { updateFields.push('special_skills = ?'); updateValues.push(special_skills); }
            if (availability !== undefined) { updateFields.push('availability = ?'); updateValues.push(availability); }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(userId);

            const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

            db.run(sql, updateValues, function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to update profile' });
                }

                res.json({ success: true, message: 'Profile updated successfully' });
            });
        }
    );
});

// Add portfolio image
app.post('/api/users/:userId/portfolio', (req, res) => {
    const { userId } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { image_url, title, description, category } = req.body;

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    db.get(
        'SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime("now")',
        [token],
        (err, session) => {
            if (err || !session) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }

            if (session.user_id != userId) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            db.run(
                'INSERT INTO user_portfolio (user_id, image_url, title, description, category) VALUES (?, ?, ?, ?, ?)',
                [userId, image_url, title, description, category],
                function(err) {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Failed to add portfolio image' });
                    }

                    res.json({ success: true, id: this.lastID });
                }
            );
        }
    );
});

// Get public user profile (for browsing)
app.get('/api/users/public/:userId', (req, res) => {
    const { userId } = req.params;

    db.get(
        'SELECT id, full_name, profile_photo_url, bio, category, height, weight, measurements, hair_color, eye_color, experience_level, portfolio_url, instagram_handle, twitter_handle, location, age, gender, languages, special_skills, verified FROM users WHERE id = ? AND status = ?',
        [userId, 'active'],
        (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to retrieve profile' });
            }

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            db.all('SELECT * FROM user_portfolio WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, portfolio) => {
                res.json({
                    ...user,
                    portfolio: portfolio || []
                });
            });
        }
    );
});

// Logout user
app.post('/api/users/logout', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(400).json({ error: 'No token provided' });
    }

    db.run('DELETE FROM user_sessions WHERE token = ?', [token], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }

        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// Apply for campaign
app.post('/api/users/:userId/apply/:campaignId', (req, res) => {
    const { userId, campaignId } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    db.get(
        'SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime("now")',
        [token],
        (err, session) => {
            if (err || !session) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }

            if (session.user_id != userId) {
                return res.status(403).json({ error: 'Unauthorized' });
            }

            db.run(
                'INSERT INTO user_applications (user_id, campaign_id) VALUES (?, ?)',
                [userId, campaignId],
                function(err) {
                    if (err) {
                        if (err.message.includes('UNIQUE')) {
                            return res.status(400).json({ error: 'Already applied for this campaign' });
                        }
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Failed to apply for campaign' });
                    }

                    res.json({ success: true, message: 'Application submitted!' });
                }
            );
        }
    );
});

// Start Server
app.listen(PORT, () => {
    console.log(`Modelite server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
