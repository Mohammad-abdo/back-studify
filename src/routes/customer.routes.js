/**
 * Customer Routes
 */

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const authenticate = require('../middleware/auth.middleware');
const { requireUserType } = require('../middleware/role.middleware');
const { validateBody, validateQuery } = require('../middleware/validation.middleware');
const { paginationSchema } = require('../utils/validators');
const { z } = require('zod');

// All routes require authentication and admin access
router.use(authenticate);
router.use(requireUserType('ADMIN'));

router.get('/', validateQuery(paginationSchema), customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);
router.put('/:id', validateBody(z.object({
  entityName: z.string().min(2).max(200).optional(),
  contactPerson: z.string().min(2).max(200).optional(),
  phone: z.string().min(10).max(20).optional(),
})), customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;


