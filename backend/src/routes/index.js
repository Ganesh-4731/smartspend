import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { protect } from '../middleware/auth.js';
import { validate, validateIdParam } from '../middleware/validate.js';
import * as S from '../validators/schemas.js';
import * as auth from '../controllers/auth.controller.js';
import * as user from '../controllers/user.controller.js';
import * as tx from '../controllers/transaction.controller.js';
import * as dash from '../controllers/dashboard.controller.js';
import * as budget from '../controllers/budget.controller.js';
import * as goal from '../controllers/goal.controller.js';
import { getInsights } from '../controllers/insight.controller.js';
import { getReport } from '../controllers/report.controller.js';

const router = Router();
const noop = (_q, _s, n) => n();
const authLimiter = env.RATE_LIMIT_DISABLED ? noop : rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' } });

router.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));

// Auth
router.post('/auth/register', authLimiter, validate(S.registerSchema), auth.register);
router.post('/auth/login', authLimiter, validate(S.loginSchema), auth.login);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', protect, auth.me);

// Everything below requires authentication
router.use(protect);

router.put('/users/me', validate(S.updateProfileSchema), user.updateProfile);
router.put('/users/me/password', authLimiter, validate(S.changePasswordSchema), user.changePassword);
router.delete('/users/me', authLimiter, validate(S.deleteAccountSchema), user.deleteAccount);

router.get('/transactions', validate(S.transactionListQuery, 'query'), tx.list);
router.get('/transactions/export', validate(S.transactionListQuery, 'query'), tx.exportCsv);
router.post('/transactions', validate(S.transactionSchema), tx.create);
router.get('/transactions/:id', validateIdParam(), tx.getOne);
router.put('/transactions/:id', validateIdParam(), validate(S.transactionSchema), tx.update);
router.delete('/transactions/:id', validateIdParam(), tx.remove);

router.get('/dashboard', validate(S.rangeQuery, 'query'), dash.getDashboard);
router.get('/insights', validate(S.rangeQuery, 'query'), getInsights);
router.get('/reports', validate(S.rangeQuery, 'query'), getReport);

router.get('/budgets', budget.list);
router.get('/budgets/status', validate(S.budgetStatusQuery, 'query'), budget.status);
router.post('/budgets', validate(S.budgetSchema), budget.create);
router.put('/budgets/:id', validateIdParam(), validate(S.budgetUpdateSchema), budget.update);
router.delete('/budgets/:id', validateIdParam(), budget.remove);

router.get('/goals', goal.list);
router.post('/goals', validate(S.goalSchema), goal.create);
router.put('/goals/:id', validateIdParam(), validate(S.goalSchema), goal.update);
router.delete('/goals/:id', validateIdParam(), goal.remove);
router.post('/goals/:id/contributions', validateIdParam(), validate(S.contributionSchema), goal.contribute);
router.delete('/goals/:id/contributions/:contributionId', validateIdParam(), validateIdParam('contributionId'), goal.removeContribution);

export default router;
