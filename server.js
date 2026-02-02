const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '/')));

// Database Connection
const dbPath = path.join(__dirname, 'db', 'svuLibrary.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath, err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// --- API ROUTES ---

// 1. Admin Login
app.post('/api/admin/login', (req, res) => {
    const { admin_id, password } = req.body;
    db.get("SELECT * FROM admin WHERE admin_id = ? AND password = ?", [admin_id, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            res.json({ success: true, admin: row });
        } else {
            res.json({ success: false, message: "Invalid Admin ID or Password" });
        }
    });
});

// 2. Student Login
app.post('/api/student/login', (req, res) => {
    const { student_id, password } = req.body;
    db.get("SELECT * FROM students WHERE student_id = ? AND password = ?", [student_id, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            res.json({ success: true, student: row });
        } else {
            res.json({ success: false, message: "Invalid Student ID or Password" });
        }
    });
});

// 3. Register Student
app.post('/api/student/register', (req, res) => {
    const { student_id, name, branch, year, password } = req.body;
    const library_id = "LIB" + Math.floor(1000 + Math.random() * 9000);

    db.run("INSERT INTO students (student_id, name, branch, year, password, library_id) VALUES (?, ?, ?, ?, ?, ?)",
        [student_id, name, branch, year, password, library_id],
        function (err) {
            if (err) {
                if (err.message.includes("UNIQUE")) {
                    return res.json({ success: false, message: "Student ID already registered." });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, library_id: library_id, message: "Registration Successful! Library ID: " + library_id });
        }
    );
});

// 4. Get Student Details (Profile)
app.get('/api/student/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM students WHERE student_id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

// 5. Get Student Issued Books (All History)
app.get('/api/issued_books/:student_id', (req, res) => {
    const id = req.params.student_id;
    const query = `
        SELECT ib.*, b.book_name 
        FROM issued_books ib
        JOIN books b ON ib.book_id = b.book_id
        WHERE ib.student_id = ?
        ORDER BY ib.status ASC, ib.issue_date DESC
    `;
    db.all(query, [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 6. Submit Query
app.post('/api/queries', (req, res) => {
    const { student_id, query_text } = req.body;
    db.run("INSERT INTO queries (student_id, query_text) VALUES (?, ?)", [student_id, query_text], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Query submitted successfully" });
    });
});

// 7. Admin: Get All Queries
app.get('/api/admin/queries', (req, res) => {
    db.all("SELECT q.*, s.name FROM queries q JOIN students s ON q.student_id = s.student_id", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 8. Admin: Get All Students
app.get('/api/admin/students', (req, res) => {
    db.all("SELECT * FROM students", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 9. Admin: Get All Books
app.get('/api/admin/books', (req, res) => {
    db.all("SELECT * FROM books", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 10. Admin: Add Book
app.post('/api/admin/add_book', (req, res) => {
    const { book_id, book_name, author, quantity } = req.body;
    db.run("INSERT INTO books (book_id, book_name, author, quantity) VALUES (?, ?, ?, ?)",
        [book_id, book_name, author, quantity],
        function (err) {
            if (err) {
                if (err.message.includes("UNIQUE")) {
                    return res.json({ success: false, message: "Book ID already exists." });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, message: "Book added successfully!" });
        }
    );
});

// 11. Admin: Add Student
app.post('/api/admin/add_student', (req, res) => {
    const { student_id, name, branch, year } = req.body;
    const password = "svu" + student_id;
    const library_id = "LIB" + Math.floor(1000 + Math.random() * 9000);

    db.run("INSERT INTO students (student_id, name, branch, year, password, library_id) VALUES (?, ?, ?, ?, ?, ?)",
        [student_id, name, branch, year, password, library_id],
        function (err) {
            if (err) {
                if (err.message.includes("UNIQUE")) {
                    return res.json({ success: false, message: "Student ID already exists." });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, message: "Student added successfully. Default Password: " + password, library_id });
        }
    );
});

// 12. Issue Book
app.post('/api/admin/issue_book', (req, res) => {
    const { student_id, book_id, issue_date } = req.body;

    db.get("SELECT quantity, book_name FROM books WHERE book_id = ?", [book_id], (err, book) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!book) return res.json({ success: false, message: "Book not found." });
        if (book.quantity <= 0) return res.json({ success: false, message: "Book out of stock." });

        db.get("SELECT no_of_books FROM students WHERE student_id = ?", [student_id], (err, student) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!student) return res.json({ success: false, message: "Student not found." });

            const dateObj = new Date(issue_date);
            dateObj.setDate(dateObj.getDate() + 7);
            const return_date = dateObj.toISOString().split('T')[0];

            db.serialize(() => {
                db.run("INSERT INTO issued_books (student_id, book_id, issue_date, return_date, fine, status) VALUES (?, ?, ?, ?, 0, 'issued')",
                    [student_id, book_id, issue_date, return_date]);

                db.run("UPDATE books SET quantity = quantity - 1 WHERE book_id = ?", [book_id]);

                db.run("UPDATE students SET no_of_books = no_of_books + 1 WHERE student_id = ?", [student_id]);
            });

            res.json({ success: true, message: `Book '${book.book_name}' Issued! Return by: ${return_date}` });
        });
    });
});

// 13. Return Book (Accept Return)
app.post('/api/admin/return_book', (req, res) => {
    const { student_id, book_id } = req.body;

    db.get(`SELECT * FROM issued_books WHERE student_id = ? AND book_id = ? AND status = 'issued'`, [student_id, book_id], (err, record) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!record) return res.json({ success: false, message: "No active issue record found for this book and student." });

        const expectedReturn = new Date(record.return_date);
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        let fine = 0;
        const expectedTime = expectedReturn.getTime();
        const todayTime = new Date(todayStr).getTime();

        if (todayTime > expectedTime) {
            const diffTime = Math.abs(todayTime - expectedTime);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            fine = diffDays * 10;
        }

        db.serialize(() => {
            db.run("UPDATE issued_books SET fine = ?, status = 'returned', return_date = ? WHERE id = ?", [fine, todayStr, record.id]);
            db.run("UPDATE books SET quantity = quantity + 1 WHERE book_id = ?", [book_id]);
            db.run("UPDATE students SET no_of_books = no_of_books - 1 WHERE student_id = ?", [student_id]);
        });

        res.json({ success: true, message: `Return Accepted. Fine Amount: ${fine}` });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
