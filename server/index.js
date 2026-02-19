import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import treeRoutes from './routes/trees.js';
import nodeRoutes from './routes/nodes.js';
import relationshipRoutes from './routes/relationships.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/trees', treeRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/relationships', relationshipRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
pool.query('SELECT NOW();', (err, result) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Database connected successfully');
  }
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
