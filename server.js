const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const app = express();
const port = 8000;

// HTML escape function to prevent XSS
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
        return unsafe;
    }
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// CSRF token generation and validation
const csrfTokens = new Map();

function generateCsrfToken() {
    return crypto.randomBytes(32).toString('hex');
}

function validateCsrfToken(req, res, next) {
    const token = req.body.csrfToken || req.headers['csrf-token'];
    const expectedToken = csrfTokens.get(req.ip);
    
    if (!token || token !== expectedToken) {
        return res.status(403).send('Invalid CSRF token');
    }
    next();
}

// Middleware to parse JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middleware - Content Security Policy to prevent XSS
app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'"
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
});

// Serve static files from the clientfiles directory
app.use(express.static(path.join(__dirname, 'clientfiles')));

// Route to serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'clientfiles', 'index.html'));
});

// Route to get CSRF token
app.get('/get-csrf-token', (req, res) => {
    const token = generateCsrfToken();
    csrfTokens.set(req.ip, token);
    res.json({ csrfToken: token });
});

// Route to get doc.txt content
app.get('/get-doc', (req, res) => {
    const filePath = path.join(__dirname, 'doc.txt');
    
    if (fs.existsSync(filePath)) {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error reading file');
            }
            // Escape HTML to prevent XSS attacks
            const safeContent = escapeHtml(data);
            res.send(safeContent);
        });
    } else {
        res.send(''); // Return empty string if file doesn't exist
    }
});

// Route to save doc.txt content
app.post('/save-doc', validateCsrfToken, (req, res) => {
    const content = req.body.content || '';
    const filePath = path.join(__dirname, 'doc.txt');
    
    fs.writeFile(filePath, content, 'utf8', (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error saving file');
        }
        res.send('File saved successfully');
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});