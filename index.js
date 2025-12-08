const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'classroom_assessments'
};

let db;

// Initialize database connection
async function initDB() {
  try {
    db = await mysql.createConnection(dbConfig);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS assessments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Database connected and table created');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET all assessments
app.get('/api/assessments', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM assessments ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// POST new assessment
app.post('/api/assessments', async (req, res) => {
  const { title, description } = req.body;
  
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO assessments (title, description) VALUES (?, ?)',
      [title, description]
    );
    res.status(201).json({ 
      id: result.insertId, 
      title, 
      description, 
      message: 'Assessment created successfully' 
    });
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

// PUT update assessment
app.put('/api/assessments/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  try {
    const [result] = await db.execute(
      'UPDATE assessments SET title = ?, description = ? WHERE id = ?',
      [title, description, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    res.json({ message: 'Assessment updated successfully' });
  } catch (error) {
    console.error('Error updating assessment:', error);
    res.status(500).json({ error: 'Failed to update assessment' });
  }
});

// DELETE assessment
app.delete('/api/assessments/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.execute('DELETE FROM assessments WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
