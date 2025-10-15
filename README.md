# 🍽️ MealMender - Food Donation Platform

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-v14+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v4+-green.svg)](https://www.mongodb.com/)

> **Share Food, Share Love** - A comprehensive platform connecting food donors with recipients to fight hunger and reduce food waste.

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 About

**MealMender** is a food donation platform designed to bridge the gap between food donors and those in need. The platform enables:

- **Donors** to post surplus food and connect with recipients
- **Recipients** to browse available food and request donations
- **Admins** to manage the platform and monitor activities

### Mission
To reduce food waste and fight hunger by creating a seamless connection between food donors and recipients in local communities.

### Impact
- 🍽️ **1000+** Meals Shared
- 👥 **500+** Community Members
- 🌱 **2 Tons** Food Waste Prevented

---

## ✨ Features

### Core Features

#### 🔐 User Authentication
- Secure registration and login system
- JWT-based authentication
- Role-based access control (Donor, Recipient, Admin)
- Password encryption with bcrypt
- Session management

#### 🎁 Food Donation Management
- Post food donations with details (name, quantity, quality, type, expiry)
- Set pickup location with address
- Edit and delete donations
- Track donation status (available, claimed, delivered)

#### 📱 Recipient Features
- Browse available food donations
- Filter and search donations
- Request food with pickup details
- Track request status
- View donation history

#### 👤 User Profiles
- **Modern, Professional Profile Page**
- View personal information
- Stats dashboard (Total Donations, Completed, Active)
- Manage donations and requests
- Edit profile information
- Auto-generated avatars with user initials

#### 🔔 Notification System
- Real-time notifications for donors and recipients
- Request status updates
- Donation acceptance/rejection alerts
- In-app notification center

#### 💬 Real-Time Chat
- Socket.io powered messaging
- Direct communication between donors and recipients
- Message history
- Online status indicators

#### 📊 Admin Dashboard
- User management
- Donation monitoring
- Platform statistics
- Content moderation
- Activity logs

### 🚀 Advanced Features

#### ⏰ Food Expiry Tracking System
**Prevent food waste with intelligent monitoring:**

- **Automatic Tracking**: Monitors all donations from posting to expiry
- **Urgency Levels**: 
  - 🟢 Safe (>5 hours)
  - 🟡 Warning (3-5 hours)
  - 🔴 Urgent (<2 hours)
  - ⚫ Expired
- **Visual Indicators**: Color-coded badges, countdown timers, urgency ribbons
- **Smart Prioritization**: Urgent food appears first for recipients
- **Real-Time Countdowns**: Live timers showing exact time remaining

#### 📧 Email Notifications
**Professional automated email system:**

- **Expiry Warnings**: Sent when food has ≤3 hours remaining
- **Beautiful HTML Emails**: Professional design with MealMender branding
- **Smart Messaging**: Different messages based on request status
- **Action Buttons**: Direct links to profile and requests
- **Mobile-Responsive**: Works on all devices
- **Multiple Providers**: Supports Gmail, SendGrid, Mailgun, Outlook

---

## 🛠️ Tech Stack

### Frontend
**✅ Pure Vanilla Stack - No Frameworks!**

- **HTML5** - Semantic markup and structure
- **CSS3** - Modern styling with custom properties
  - Flexbox and Grid layouts
  - Animations and transitions
  - Responsive design
- **JavaScript (ES6+)** - Pure vanilla JavaScript
  - ❌ No React, Vue, or Angular
  - DOM manipulation
  - Fetch API for HTTP requests
  - Async/await patterns
- **Bootstrap 5.3.3** - UI components and responsive grid
  - CDN-based (no npm required)
  - Customized with CSS variables
- **Font Awesome 6.4.0** - Icons
- **Google Fonts** - Typography (Playfair Display, Inter)

### Backend

- **Node.js** (v14+) - Runtime environment
- **Express.js** (v4.18+) - Web framework
- **MongoDB** (v4+) - NoSQL database
- **Mongoose** (v7.5+) - ODM for MongoDB

### Authentication & Security

- **JWT (jsonwebtoken)** - Token-based authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Real-Time Communication

- **Socket.io** (v4.7+) - WebSocket for real-time chat

### Email Service

- **Nodemailer** (v6.9+) - Email sending
- Supports: Gmail, SendGrid, Mailgun, Outlook, Yahoo

### Development Tools

- **Nodemon** - Auto-restart server during development
- **Git** - Version control

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4 or higher) - [Download](https://www.mongodb.com/try/download/community)
  - Or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (cloud database)
- **Git** - [Download](https://git-scm.com/downloads)
- **Web Browser** - Chrome, Firefox, Edge, or Safari
- **Text Editor** - VS Code, Sublime Text, or any editor

### System Requirements

- **OS**: Windows, macOS, or Linux
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 500MB free space
- **Internet**: Required for CDN resources and email service

---

## 📦 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/mealmender.git
cd mealmender
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

This will install:
- express
- mongoose
- cors
- bcryptjs
- jsonwebtoken
- dotenv
- socket.io
- nodemailer
- body-parser

### Step 3: Set Up MongoDB

#### Option A: Local MongoDB

1. Install MongoDB Community Edition
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```
3. MongoDB will run on `mongodb://localhost:27017`

#### Option B: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string
4. Whitelist your IP (or use 0.0.0.0/0 for development)

### Step 4: Configure Environment Variables

1. Navigate to backend folder:
   ```bash
   cd backend
   ```

2. Create `.env` file:
   ```bash
   # Windows
   copy .env.example .env
   
   # macOS/Linux
   cp .env.example .env
   ```

3. Edit `.env` file with your configuration:
   ```env
   # Database
   MONGO_URI=mongodb://localhost:27017/mealmender
   
   # Server
   PORT=5000
   
   # JWT Secret (change this!)
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   
   # Frontend URL
   FRONTEND_URL=http://localhost:5500
   
   # Email Configuration (Optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=MealMender <your-email@gmail.com>
   ```

### Step 5: Start the Backend Server

```bash
cd backend
npm start
```

You should see:
```
🚀 Server running on port 5000
✅ MongoDB Connected
✅ Email service initialized successfully
✅ Expiry tracking service started successfully
```

### Step 6: Open the Frontend

#### Option A: Using Live Server (Recommended)

1. Install [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension in VS Code
2. Right-click on `frontend/index.html`
3. Select "Open with Live Server"
4. Browser opens at `http://localhost:5500`

#### Option B: Direct File Opening

1. Navigate to `frontend` folder
2. Double-click `index.html`
3. Opens in default browser

**Note**: Some features (like fetch API) work better with Live Server.

---

## ⚙️ Configuration

### Frontend Configuration

Edit `frontend/config.js`:

```javascript
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'https://your-production-backend.com';

window.API_BASE_URL = API_BASE_URL;
```

### Email Setup (Optional)

For email notifications to work:

1. **Gmail**: Use App Password (not regular password)
   - Enable 2FA: https://myaccount.google.com/security
   - Generate App Password: https://myaccount.google.com/apppasswords

2. **SendGrid** (Recommended for production):
   - Sign up: https://sendgrid.com
   - Get API key
   - Verify sender email

See `EMAIL_SETUP_GUIDE.md` for detailed instructions.

---

## 💻 Usage

### For Donors

1. **Sign Up / Login** - Create account or login
2. **Post Food Donation** - Fill in food details and submit
3. **Manage Donations** - View, edit, or delete donations
4. **Handle Requests** - Review and accept/reject requests
5. **Receive Email Alerts** - Get notified when food is expiring

### For Recipients

1. **Sign Up / Login** - Create account
2. **Browse Food** - View available donations with urgency indicators
3. **Request Food** - Submit request with pickup details
4. **Track Requests** - Monitor request status
5. **Coordinate Pickup** - Chat with donor

### For Admins

1. **Access Admin Dashboard** - Login with admin credentials
2. **Manage Users** - View and manage all users
3. **Monitor Donations** - Check statistics and moderate content
4. **Generate Reports** - Export data and view analytics

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

#### Donations
- `GET /api/donations` - Get all donations
- `POST /api/donations` - Create donation (auth required)
- `GET /api/donations/my-donations` - Get user's donations (auth required)
- `PUT /api/donations/:id` - Update donation (auth required)
- `DELETE /api/donations/:id` - Delete donation (auth required)

#### Requests
- `POST /api/requests` - Create request (auth required)
- `GET /api/requests/my-requests` - Get user's requests (auth required)
- `PUT /api/requests/:id/status` - Accept/reject request (auth required)

#### Profile
- `GET /api/profile/me` - Get user profile (auth required)
- `PUT /api/profile/me` - Update profile (auth required)

For complete API documentation with examples, see the API section above.

---

## 🌐 Deployment

### Backend (Heroku)

```bash
cd backend
heroku create mealmender-backend
heroku config:set MONGO_URI=your_mongodb_atlas_uri
heroku config:set JWT_SECRET=your_jwt_secret
git push heroku main
```

### Frontend (Netlify)

1. Update `frontend/config.js` with production backend URL
2. Drag and drop `frontend` folder to Netlify
3. Or connect GitHub repository for auto-deployment

### Database (MongoDB Atlas)

1. Create free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get connection string
3. Use in `MONGO_URI` environment variable

---

## 📁 Project Structure

```
mealmender/
├── backend/                    # Backend server
│   ├── config/                 # Configuration files
│   ├── controllers/            # Route controllers
│   ├── middlewares/            # Custom middlewares
│   ├── models/                 # Mongoose models
│   ├── routes/                 # API routes
│   ├── services/               # Business logic
│   │   ├── emailService.js     # Email notifications
│   │   └── expiryTrackingService.js  # Expiry monitoring
│   ├── .env.example            # Environment template
│   ├── package.json            # Dependencies
│   └── server.js               # Entry point
│
├── frontend/                   # Frontend application
│   ├── css/                    # Stylesheets
│   ├── assets/                 # Images, icons
│   ├── config.js               # API configuration
│   ├── index.html              # Landing page
│   ├── profile.html            # User profile (redesigned)
│   ├── donation.html           # Create donation
│   ├── receiver.html           # Browse donations
│   └── ...                     # Other pages
│
├── docs/                       # Documentation
│   ├── FOOD_EXPIRY_TRACKING.md
│   ├── EMAIL_SETUP_GUIDE.md
│   └── QUICK_START_GUIDE.md
│
└── README.md                   # This file
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 📞 Support

For questions or issues:
- Check the documentation in the `docs/` folder
- Review server logs for errors
- Verify configuration in `.env` file

---

## 🎉 Acknowledgments

- Built with ❤️ to fight food waste and hunger
- Thanks to all contributors and users
- Special thanks to the open-source community

---

**MealMender - Share Food, Share Love 🍽️💚**
