import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => res.json({ message: 'Content endpoints - coming soon' }));
export default router;