# Modelite Website

A professional, modern website for Modelite - a premier modeling agency with full backend and admin dashboard.

## Features

- **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices
- **Navigation Bar** - Sticky navigation with smooth scrolling and mobile hamburger menu
- **Hero Section** - Eye-catching hero with call-to-action button
- **Portfolio Showcase** - Grid layout displaying model portfolios
- **Services** - Comprehensive list of agency services
- **About Section** - Company information with statistics
- **Contact Section** - Contact form with backend integration
- **Smooth Animations** - Scroll animations and hover effects
- **Modern Gradient Design** - Professional color scheme with gradient accents

## Backend Features

- **Express.js Server** - Fast and scalable backend
- **SQLite Database** - Local data persistence with 6 main tables:
  - `contacts` - Website contact form submissions
  - `inquiries` - Model application inquiries
  - `models` - Model portfolio management
  - `campaigns` - Marketing/fashion campaigns
  - `model_campaigns` - Model-to-campaign assignments
  - `statistics` - Agency statistics
- **Email Notifications** - Automated emails via SMTP (Gmail configured)
- **Admin Endpoints** - Secure API endpoints with admin key authentication
- **Admin Dashboard** - Full-featured management interface at `/admin.html`

## Project Structure

```
modelite/
├── index.html              # Main website
├── styles.css              # Website styling
├── script.js               # Website JavaScript
├── admin.html              # Admin dashboard
├── admin-styles.css        # Admin dashboard styling
├── admin-script.js         # Admin dashboard JavaScript
├── server.js               # Backend Express server
├── package.json            # Node.js dependencies
├── .env                    # Environment configuration
├── .gitignore              # Git ignore file
├── BACKEND_SETUP.md        # Backend setup guide
└── README.md               # This file
```

## Installation & Setup

### 1. Install Dependencies
```powershell
npm install
```

### 2. Configure Environment Variables
Edit `.env` file:
```
PORT=5000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=info@modelite.com
ADMIN_KEY=your-secure-admin-key
```

### 3. Start the Backend Server
```powershell
npm start
```
Server runs on `http://localhost:5000`

### 4. Access the Website
- **Main Site**: Open `index.html` in browser
- **Admin Dashboard**: Navigate to `http://localhost:5000/admin.html`
  - Enter your admin key when prompted
  - Manage models, campaigns, and view submissions

## Database Schema

### Contacts Table
- id, name, email, subject, message, status, created_at, updated_at

### Inquiries Table
- id, name, email, phone, inquiry_type, message, status, created_at, updated_at

### Models Table
- id, name, email, phone, category, height, measurements, bio, portfolio_url, photo_url, status, created_at, updated_at

### Campaigns Table
- id, title, description, client, budget, status, start_date, end_date, created_at, updated_at

### Model_Campaigns Table (Assignments)
- id, model_id, campaign_id, role, compensation, status, created_at

### Statistics Table
- id, total_models, total_campaigns, total_inquiries, total_contacts, date, updated_at

## API Endpoints

### Public Endpoints
- `POST /api/contact` - Submit contact form
- `POST /api/apply` - Submit model application
- `GET /api/models` - Get all active models
- `GET /api/models/:id` - Get single model details
- `GET /api/campaigns` - Get all active campaigns
- `GET /api/campaigns/:id` - Get campaign with assigned models
- `GET /api/health` - Server health check

### Admin Endpoints (require ?key=ADMIN_KEY)
- `GET /api/admin/contacts` - View all contact submissions
- `GET /api/admin/inquiries` - View all model inquiries
- `GET /api/admin/stats` - Get dashboard statistics
- `POST /api/admin/models` - Add new model
- `PUT /api/admin/models/:id` - Update model
- `DELETE /api/admin/models/:id` - Delete model
- `POST /api/admin/campaigns` - Create campaign
- `POST /api/admin/campaigns/:campaignId/assign-model` - Assign model to campaign
- `PUT /api/admin/contacts/:id` - Update contact status

## Admin Dashboard Features

### Dashboard
- View key statistics at a glance
- Active models count
- Active campaigns count
- New inquiries count
- New contacts count

### Contacts Management
- View all website inquiries
- Mark contacts as replied
- Track submission dates

### Inquiries Management
- View all model applications
- Track application status
- View applicant details

### Models Management
- Add new models to portfolio
- View all agency models
- Edit model information
- Delete models from system
- Manage model categories (Runway, Commercial, Editorial, Plus Size, Influencer)

### Campaigns Management
- Create new campaigns
- View all active campaigns
- Assign models to campaigns
- Track campaign details (client, budget, dates)

## Email Configuration

### Gmail Setup
1. Enable 2-Factor Authentication
2. Generate App Password at https://myaccount.google.com/apppasswords
3. Copy 16-character password to `SMTP_PASS` in `.env`
4. Set `SMTP_USER` to your Gmail address

### Other Email Providers
Update these settings in `.env`:
- `SMTP_HOST` - Email server address
- `SMTP_PORT` - SMTP port (usually 587)
- `SMTP_USER` - Your email account
- `SMTP_PASS` - Email account password

## Development

### Run with Auto-reload
```powershell
npm install -g nodemon
nodemon server.js
```

### View Database
The SQLite database (`modelite.db`) is created automatically on first run.

To view/manage the database:
```powershell
npm install -g sqlite3
sqlite3 modelite.db
```

## Production Deployment

### Environment Setup
1. Update `.env` with production values
2. Set `NODE_ENV=production`
3. Update `API_BASE_URL` in `script.js` and `admin-script.js` to your production server

### Hosting Options
- **Heroku** - `npm install -g heroku-cli` then `heroku create`
- **Railway** - Deploy from GitHub
- **Render** - Free tier available
- **AWS** - EC2 or Lambda
- **DigitalOcean** - App Platform

## Customization

### Update Company Information
Edit these files:
- `index.html` - Contact details, service descriptions
- `.env` - Admin email, SMTP settings

### Modify Design
- `styles.css` - Website colors and layout
- `admin-styles.css` - Admin dashboard styling

### Add More Features
- Model images - Upload to `modelite.db` as URLs
- Social media integration - Update footer links
- Payment processing - Add Stripe or PayPal
- Email templates - Customize in `server.js`

## Troubleshooting

### Backend won't start
- Check if port 5000 is available
- Verify Node.js is installed: `node --version`
- Check `.env` file has correct settings

### Email not sending
- Verify SMTP credentials in `.env`
- Check Gmail app password (not regular password)
- Allow "Less secure apps" if using Gmail

### Admin dashboard not loading
- Ensure backend server is running
- Check admin key in localStorage
- Verify `API_BASE_URL` in `admin-script.js`

### Database issues
- Delete `modelite.db` to reset database
- Check database file permissions
- Verify SQLite3 is installed

## Security Notes

- Always change `ADMIN_KEY` to a strong secret
- Never commit `.env` file with real credentials
- Use HTTPS in production
- Implement rate limiting for production
- Add user authentication for admin panel
- Validate all form inputs on backend

## Future Enhancements

- Payment processing (Stripe/PayPal)
- Advanced image gallery
- Model portfolio uploads
- Agency team profiles
- Blog section
- Multi-language support
- User authentication for models
- Analytics dashboard
- Booking system
- Contract management

## Support

For issues or questions, contact: info@modelite.com

## License

MIT License - Modelite 2026
