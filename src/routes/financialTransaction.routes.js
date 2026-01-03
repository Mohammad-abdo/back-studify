/**
 * Financial Transaction Routes
 */

const express = require('express');
const router = express.Router();
const financialTransactionController = require('../controllers/financialTransaction.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema, uuidSchema } = require('../utils/validators');
const { z } = require('zod');

// All routes require authentication and admin access
router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.get('/', validateQuery(paginationSchema), financialTransactionController.getFinancialTransactions);
router.get('/:id', financialTransactionController.getFinancialTransactionById);
router.post('/', validateBody(z.object({
  type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'PAYMENT', 'REFUND', 'COMMISSION']),
  amount: z.number().positive(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  description: z.string().optional(),
  deliveryId: uuidSchema.optional().nullable(),
  orderId: uuidSchema.optional().nullable(),
  metadata: z.any().optional(),
})), financialTransactionController.createFinancialTransaction);
router.put('/:id', validateBody(z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  description: z.string().optional(),
  metadata: z.any().optional(),
})), financialTransactionController.updateFinancialTransaction);
router.delete('/:id', financialTransactionController.deleteFinancialTransaction);

module.exports = router;


