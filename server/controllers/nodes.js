import pool from '../db.js';

export const getNodesByTreeId = (req, res) => {
  const { treeId } = req.params;
  pool.query(
    'SELECT * FROM nodes WHERE tree_id = $1 ORDER BY created_at',
    [treeId],
    (err, result) => {
      if (err) {
        console.error('Error fetching nodes:', err);
        res.status(500).json({ error: 'Failed to fetch nodes' });
        return;
      }
      res.json(result.rows);
    }
  );
};

export const getNodeById = (req, res) => {
  const { id } = req.params;
  pool.query('SELECT * FROM nodes WHERE id = $1', [id], (err, result) => {
    if (err) {
      console.error('Error fetching node:', err);
      res.status(500).json({ error: 'Failed to fetch node' });
      return;
    }
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }
    res.json(result.rows[0]);
  });
};

export const createNode = (req, res) => {
  const { treeId, name, photoUrl, birthDate, gender, description, xPosition, yPosition } = req.body;
  pool.query(
    'INSERT INTO nodes (tree_id, name, photo_url, birth_date, gender, description, x_position, y_position) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [treeId, name, photoUrl, birthDate, gender, description, xPosition, yPosition],
    (err, result) => {
      if (err) {
        console.error('Error creating node:', err);
        res.status(500).json({ error: 'Failed to create node' });
        return;
      }
      res.json(result.rows[0]);
    }
  );
};

export const updateNode = (req, res) => {
  const { id } = req.params;
  const { name, photoUrl, birthDate, gender, description, xPosition, yPosition } = req.body;
  pool.query(
    'UPDATE nodes SET name = $1, photo_url = $2, birth_date = $3, gender = $4, description = $5, x_position = $6, y_position = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
    [name, photoUrl, birthDate, gender, description, xPosition, yPosition, id],
    (err, result) => {
      if (err) {
        console.error('Error updating node:', err);
        res.status(500).json({ error: 'Failed to update node' });
        return;
      }
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Node not found' });
        return;
      }
      res.json(result.rows[0]);
    }
  );
};

export const deleteNode = (req, res) => {
  const { id } = req.params;
  pool.query('DELETE FROM nodes WHERE id = $1 RETURNING *', [id], (err, result) => {
    if (err) {
      console.error('Error deleting node:', err);
      res.status(500).json({ error: 'Failed to delete node' });
      return;
    }
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }
    res.json({ message: 'Node deleted successfully' });
  });
};
