import express from 'express';
import * as treesController from '../controllers/trees.js';

const router = express.Router();

router.get('/', treesController.getTrees);
router.get('/:id', treesController.getTreeById);
router.post('/', treesController.createTree);
router.put('/:id', treesController.updateTree);
router.delete('/:id', treesController.deleteTree);

export default router;
