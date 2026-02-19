import express from 'express';
import * as nodesController from '../controllers/nodes.js';

const router = express.Router();

router.get('/tree/:treeId', nodesController.getNodesByTreeId);
router.get('/:id', nodesController.getNodeById);
router.post('/', nodesController.createNode);
router.put('/:id', nodesController.updateNode);
router.delete('/:id', nodesController.deleteNode);

export default router;
