# SVU Library Management System

This is a complete Library Management System built with HTML, CSS, JavaScript, and SQLite.

## Project Structure

- `index.html`: Home page.
- `studentLogin.html`: Student login and registration.
- `adminLogin.html`: Admin login.
- `dashboard/`: Contains dashboard pages for Student and Admin.
- `css/`: Styling using variable-based CSS and Glassmorphism.
- `db/`: Contains the SQLite database (`svuLibrary.db`) and initialization script.
- `server.js`: Node.js server to handle SQLite interactions.

## Prerequisites

- Node.js installed on your machine.

## Setup & Run Instructions

1. **Install Dependencies**:
   Open a terminal in the project folder and run:
   ```bash
   npm install
   ```

2. **Initialize Database**:
   (Already done, but if needed to reset)
   ```bash
   npm run init-db
   ```

3. **Start the Server**:
   ```bash
   npm start
   ```
   or
   ```bash
   node server.js
   ```

4. **Access the Application**:
   Open your browser and navigate to:
   `http://localhost:3000`

## Accounts

- **Admin Login**:
  - Admin ID: `admin`
  - Password: `admin123`

- **Student Login**:
  - Sample ID: `S001`
  - Password: `student123`
  - Or Register a new student.

## Features

- **Students**: Register, Login, View Profile (Issued Books, Fines), Submit Queries.
- **Admin**: Login, View All Students/Books/Queries, Add Books, Add Students, Issue Books, Accept Returns (Calculate Fines).

## Technical Note

- The backend is a minimal Node.js Express server used *strictly* to safely interact with the SQLite database file (`svuLibrary.db`), as browsers cannot write to files directly.
- All application logic (Flow, Validation, UI) is handled in the frontend JavaScript.
