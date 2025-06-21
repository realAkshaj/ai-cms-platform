import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => res.json({ message: 'Users endpoints - coming soon' }));
export default router;