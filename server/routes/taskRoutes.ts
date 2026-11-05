import { Router } from 'express';
import {
  TaskController,
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  filterTasksQuerySchema,
} from '../controllers/taskController.ts';
import { validateBody, validateQuery } from '../middleware/validate.ts';
import { authenticate } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(filterTasksQuerySchema), TaskController.listTasks);
router.post('/', validateBody(createTaskSchema), TaskController.createTask);
router.get('/:id', TaskController.getTask);
router.patch('/:id', validateBody(updateTaskSchema), TaskController.updateTask);
router.patch('/:id/move', validateBody(moveTaskSchema), TaskController.moveTask);
router.delete('/:id', TaskController.deleteTask);

export default router;
