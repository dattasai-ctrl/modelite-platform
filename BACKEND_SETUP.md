# Modelite Backend Setup Guide

## Overview
The Modelite backend is built with Node.js/Express and includes:
- Contact form handling with email notifications
- SQLite database for storing submissions
- Model application submissions
- Admin API endpoints to view submissions

## Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

1. **Install Dependencies**
   ```powershell
   npm install
   ```

2. **Configure Environment Variables**
   
   Edit the `.env` file and update:
   - `SMTP_USER` - Your email address (Gmail example provided)
   - `SMTP_PASS` - Your email app password
   - `ADMIN_EMAIL` - Where contact forms should be sent
   - `ADMIN_KEY` - Secret key for admin endpoints

   ### Setting up Gmail:
   1. Enable 2-Factor Authentication on your Google Account
   2. Generate an App Password at https://myaccount.google.com/apppasswords
   3. Use this 16-character password as `SMTP_PASS`

3. **Start the Server**
   ```powershell
   npm start
   ```
   
   Server will run on `http://localhost:5000`

## API Endpoints

### POST `/api/contact`
Submit a contact form message
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Inquiry",
  "message": "Your message here"
}
```

### POST `/api/apply`
Submit a model application
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1-555-1234",
  "inquiryType": "Runway Model",
  "message": "I'm interested in joining"
}
```

### GET `/api/admin/contacts?key=YOUR_ADMIN_KEY`
Retrieve all contact submissions (requires admin key)

### GET `/api/admin/inquiries?key=YOUR_ADMIN_KEY`
Retrieve all model applications (requires admin key)

## Database
- SQLite database: `modelite.db` (auto-created on first run)
- Tables: `contacts`, `inquiries`

## Frontend Integration
The frontend is already configured to send requests to `http://localhost:5000/api`

## Development
For development with auto-reload:
```powershell
npm install -g nodemon
nodemon server.js
```

## Deployment
To deploy to production:
1. Update `.env` with production settings
2. Set `NODE_ENV=production`
3. Use a hosting service like Heroku, Railway, or Render
4. Update `API_BASE_URL` in `script.js` to point to your production server
