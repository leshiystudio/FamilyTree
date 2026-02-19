import express from 'express';
import * as relationshipsController from '../controllers/relationships.js';

const router = express.Router();

router.get('/tree/:treeId', relationshipsController.getRelationshipsByTreeId);
router.get('/:id', relationshipsController.getRelationshipById);
router.post('/', relationshipsController.createRelationship);
router.put('/:id', relationshipsController.updateRelationship);
router.delete('/:id', relationshipsController.deleteRelationship);

export default router;
