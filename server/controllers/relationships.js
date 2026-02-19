import pool from '../db.js';

export const getRelationshipsByTreeId = (req, res) => {
  const { treeId } = req.params;
  pool.query(
    'SELECT * FROM relationships WHERE tree_id = $1 ORDER BY created_at',
    [treeId],
    (err, result) => {
      if (err) {
        console.error('Error fetching relationships:', err);
        res.status(500).json({ error: 'Failed to fetch relationships' });
        return;
      }
      res.json(result.rows);
    }
  );
};

export const getRelationshipById = (req, res) => {
  const { id } = req.params;
  pool.query('SELECT * FROM relationships WHERE id = $1', [id], (err, result) => {
    if (err) {
      console.error('Error fetching relationship:', err);
      res.status(500).json({ error: 'Failed to fetch relationship' });
      return;
    }
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Relationship not found' });
      return;
    }
    res.json(result.rows[0]);
  });
};

export const createRelationship = (req, res) => {
  const { treeId, sourceNodeId, targetNodeId, relationshipType } = req.body;
  pool.query(
    'INSERT INTO relationships (tree_id, source_node_id, target_node_id, relationship_type) VALUES ($1, $2, $3, $4) RETURNING *',
    [treeId, sourceNodeId, targetNodeId, relationshipType],
    (err, result) => {
      if (err) {
        console.error('Error creating relationship:', err);
        res.status(500).json({ error: 'Failed to create relationship' });
        return;
      }
      res.json(result.rows[0]);
    }
  );
};

export const updateRelationship = (req, res) => {
  const { id } = req.params;
  const { relationshipType } = req.body;
  pool.query(
    'UPDATE relationships SET relationship_type = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
    [relationshipType, id],
    (err, result) => {
      if (err) {
        console.error('Error updating relationship:', err);
        res.status(500).json({ error: 'Failed to update relationship' });
        return;
      }
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Relationship not found' });
        return;
      }
      res.json(result.rows[0]);
    }
  );
};

export const deleteRelationship = (req, res) => {
  const { id } = req.params;
  pool.query('DELETE FROM relationships WHERE id = $1 RETURNING *', [id], (err, result) => {
    if (err) {
      console.error('Error deleting relationship:', err);
      res.status(500).json({ error: 'Failed to delete relationship' });
      return;
    }
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Relationship not found' });
      return;
    }
    res.json({ message: 'Relationship deleted successfully' });
  });
};
