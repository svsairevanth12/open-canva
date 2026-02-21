import { Router } from 'express';

import { removeBackground } from '../controllers/mediaController.js';

const router = Router();

router.post('/remove-background', removeBackground);

export default router;
