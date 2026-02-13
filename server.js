const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 8000;

// Middleware to parse JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the clientfiles directory
app.use(express.static(path.join(__dirname, 'clientfiles')));

// Route to serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'clientfiles', 'index.html'));
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
            res.send(data);
        });
    } else {
        res.send(''); // Return empty string if file doesn't exist
    }
});

// Route to save doc.txt content
app.post('/save-doc', (req, res) => {
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