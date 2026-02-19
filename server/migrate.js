import pool from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const createTables = `
-- Create trees table
CREATE TABLE IF NOT EXISTS trees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create nodes table
CREATE TABLE IF NOT EXISTS nodes (
  id SERIAL PRIMARY KEY,
  tree_id INTEGER REFERENCES trees(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  photo_url TEXT,
  birth_date DATE,
  gender VARCHAR(10),
  description TEXT,
  x_position FLOAT DEFAULT 0,
  y_position FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create relationships table
CREATE TABLE IF NOT EXISTS relationships (
  id SERIAL PRIMARY KEY,
  tree_id INTEGER REFERENCES trees(id) ON DELETE CASCADE,
  source_node_id INTEGER REFERENCES nodes(id) ON DELETE CASCADE,
  target_node_id INTEGER REFERENCES nodes(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create history table for undo/redo
CREATE TABLE IF NOT EXISTS history (
  id SERIAL PRIMARY KEY,
  tree_id INTEGER REFERENCES trees(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nodes_tree_id ON nodes(tree_id);
CREATE INDEX IF NOT EXISTS idx_relationships_tree_id ON relationships(tree_id);
CREATE INDEX IF NOT EXISTS idx_history_tree_id ON history(tree_id);
`;

pool.query(createTables, (err, result) => {
  if (err) {
    console.error('Error creating tables:', err);
  } else {
    console.log('Tables created successfully');
  }
});

export default pool;
