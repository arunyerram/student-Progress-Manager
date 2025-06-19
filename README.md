# Student Progress Management System

A full-stack dashboard for tracking coding progress, contest history, and problem-solving activity for students on [Codeforces](https://codeforces.com/).  
Built with **React**, **Node.js**, **Express**, and **MongoDB**.  
Designed for easy management of multiple students, including automated reminders and detailed analytics.

Deployed Link: https://poetic-shortbread-a057ee.netlify.app/
Video's Link:
https://www.loom.com/share/50b4bf0f50e4416a99b8e4503c72ab17?sid=08ffed10-1fbe-428f-8029-d7f48bc0a6f7
https://www.loom.com/share/5676d77fe9174cb3a77c4e3188263b52?sid=77636fbe-13f1-4600-84a4-2c38ca3cc7d9

---

## 🚀 Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Setup & Installation](#setup--installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Product Structure](#product-structure)
- [Important Notes](#important-notes)
- [Contributors](#contributors)
- [Video Demo](#video-demo)

---

## ✨ Features

- **Student Manager:** Add, edit, view, or delete student records (name, email, phone, Codeforces handle, etc.)
- **Profile Dashboard:** For each student, see:
  - Contest rating graph & contest history (filter by 30/90/365 days)
  - Problem-solving statistics & difficulty breakdowns
  - Heatmap of daily submissions
  - Most difficult problem solved (last 90 days)
  - Reminder email count, toggle, and reset
  - Data sync scheduling (choose daily sync hour)
- **Automated Codeforces Sync:**
  - Fetches up-to-date data daily (customizable hour)
  - Manual sync option on profile page
- **Inactivity Detection:**
  - Detects students with no submissions in the last 7 days
  - Sends them a reminder email (unless disabled)
- **Export:** Download student data as CSV
- **Mobile & Tablet Responsive:** Works on all screen sizes
- **Light/Dark Mode:** Toggle UI theme
- **Professional UI:** Modern design with accessible colors and spacing
- **Well-documented code**

---

## 🖼️ Screenshots

![image](https://github.com/user-attachments/assets/64b4edf0-b387-4a7c-930a-39f5997dd171)
![image](https://github.com/user-attachments/assets/ad83ecc4-7245-44b4-9899-cf05df498249)
![image](https://github.com/user-attachments/assets/deec2a47-0e50-4151-a3a0-cd9e7058ef6b)
![image](https://github.com/user-attachments/assets/d1985063-5f04-4f00-9b25-c6c3693e0e3c)
![image](https://github.com/user-attachments/assets/b041112c-3d60-4937-83b6-7036ec54fd40)


---

## 🛠️ Tech Stack

- **Frontend:** React, recharts, react-calendar-heatmap, CSS
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Others:** Nodemailer (for reminders), Axios, dotenv, etc.

---

## 🏁 Setup & Installation

### 1. **Clone the Repo**
```bash
git clone https://github.com/arunyerram/student-Progress-Manager.git
cd student-Progress-Manager




💻 Usage
Add Students:
Use "Add Student" button on dashboard.
Fill in name, email, phone, and Codeforces handle.

View Profiles:
Click "View" for detailed analytics and controls.

Sync Data:
Use "Sync Data" to update Codeforces info in real-time.

Reminders:
Toggle automatic inactivity reminder emails per student.

Export:
Download CSV of all student progress.

Dark/Light Mode:
Use the UI toggle button.

Mobile:
Responsive design—try it on your phone/tablet!


📚 API Documentation
Student Endpoints
Method	Endpoint	Description
GET	/api/students	List all students
POST	/api/students	Add new student
GET	/api/students/:id	Get single student
PATCH	/api/students/:id	Edit student details
DELETE	/api/students/:id	Remove student
POST	/api/students/:id/sync	Fetch latest Codeforces data
PATCH	/api/students/:id/reminder	Toggle reminder emails
PATCH	/api/students/:id/reset-reminder	Reset reminder count to 0
PATCH	/api/students/:id/sync-hour	Set daily sync time (hour)
GET	/api/students/:id/contests?days=90	Contest history for N days
GET	/api/students/:id/problems?days=30	Problems solved in N days
GET	/api/students/:id/most-difficult-problem?days=90	Most difficult problem solved


Product Structure

student-Progress-Manager/
│
├── backend/
│   ├── models/         # Mongoose Schemas
│   ├── routes/         # Express Routers & Controllers
│   ├── services/       # Codeforces API, Mailer, etc.
│   ├── .env            # Environment secrets (not committed)
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/ # React UI components
│   │   ├── App.js      # App entry point
│   │   └── ...         # Pages, CSS, etc.
│   └── public/
│
├── .gitignore
├── README.md
└── API_DOC.md          # API reference (see above)



👨‍💻 Contributors
https://github.com/arunyerram

🎥 Video Demo
https://www.loom.com/share/50b4bf0f50e4416a99b8e4503c72ab17?sid=08ffed10-1fbe-428f-8029-d7f48bc0a6f7
https://www.loom.com/share/5676d77fe9174cb3a77c4e3188263b52?sid=77636fbe-13f1-4600-84a4-2c38ca3cc7d9
