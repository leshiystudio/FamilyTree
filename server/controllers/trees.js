import pool from '../db.js';

export const getTrees = (req, res) => {
  pool.query('SELECT * FROM trees ORDER BY created_at DESC', (err, result) => {
    if (err) {
      console.error('Error fetching trees:', err);
      res.status(500).json({ error: 'Failed to fetch trees' });
      return;
    }
    res.json(result.rows);
  });
};

export const getTreeById = (req, res) => {
  const { id } = req.params;
  pool.query('SELECT * FROM trees WHERE id = $1', [id], (err, result) => {
    if (err) {
      console.error('Error fetching tree:', err);
      res.status(500).json({ error: 'Failed to fetch tree' });
      return;
    }
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Tree not found' });
      return;
    }
    res.json(result.rows[0]);
  });
};

export const createTree = (req, res) => {
  const { name, description } = req.body;
  pool.query(
    'INSERT INTO trees (name, description) VALUES ($1, $2) RETURNING *',
    [name, description],
    (err, result) => {
      if (err) {
        console.error('Error creating tree:', err);
        res.status(500).json({ error: 'Failed to create tree' });
        return;
      }
      res.json(result.rows[0]);
    }
  );
};

export const updateTree = (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  pool.query(
    'UPDATE trees SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
    [name, description, id],
    (err, result) => {
      if (err) {
        console.error('Error updating tree:', err);
        res.status(500).json({ error: 'Failed to update tree' });
        return;
      }
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Tree not found' });
        return;
      }
      res.json(result.rows[0]);
    }
  );
};

export const deleteTree = (req, res) => {
  const { id } = req.params;
  pool.query('DELETE FROM trees WHERE id = $1 RETURNING *', [id], (err, result) => {
    if (err) {
      console.error('Error deleting tree:', err);
      res.status(500).json({ error: 'Failed to delete tree' });
      return;
    }
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Tree not found' });
      return;
    }
    res.json({ message: 'Tree deleted successfully' });
  });
};
