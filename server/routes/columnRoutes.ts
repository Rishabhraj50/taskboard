import { Router } from 'express';
import {
  ColumnController,
  createColumnSchema,
  updateColumnSchema,
  reorderColumnsSchema,
} from '../controllers/columnController.ts';
import { validateBody } from '../middleware/validate.ts';
import { authenticate } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

router.post('/', validateBody(createColumnSchema), ColumnController.createColumn);
router.patch('/reorder', validateBody(reorderColumnsSchema), ColumnController.reorderColumns);
router.patch('/:id', validateBody(updateColumnSchema), ColumnController.updateColumn);
router.delete('/:id', ColumnController.deleteColumn);

export default router;
