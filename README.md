# SkillSwap – Peer-to-Peer Learning Platform

SkillSwap is a peer-to-peer learning platform where users can connect with others to exchange skills, collaborate, and learn together. The platform helps users find people with complementary skills and build a trusted learning community.


## Features

- User Authentication (Register/Login)
- Create and Manage User Profiles
- Add Skills You Offer
- Add Skills You Want to Learn
- Skill Matching System
- User Connections & Collaboration
- Trust & Rating System
- Geo-based User Support
- Responsive Frontend Interface


## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- MongoDB


## Project Structure

```bash
SkillSwap/
│
├── FrontEnd/          # Frontend files
├── BackEnd/           # Backend API and database logic
├── controllers/       # Application controllers
├── models/            # MongoDB models
├── middleware/        # Authentication & error handling
└── README.md
```


## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-link>
```

### 2. Navigate to Backend Folder

```bash
cd BackEnd
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the `BackEnd` folder and add:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

### 5. Run Backend Server

```bash
npm start
```

### 6. Run Frontend

Open `index.html` from the `FrontEnd` folder in your browser.



## Future Improvements

- Real-time Chat System
- Video Call Integration
- AI-based Skill Recommendations
- Advanced Search Filters
- Notifications & Messaging
- Mobile Responsive Enhancements



## Project Status

Active Development 



## Team Project

Developed as a collaborative academic project for building a peer-to-peer skill exchange and learning platform.
