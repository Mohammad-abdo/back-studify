const customerRepository = require('../repositories/customerRepository');
const { buildPagination, getPaginationParams } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

const getCustomers = async ({ page, limit, search }) => {
  const paginationParams = getPaginationParams(page, limit);
  const where = {
    ...(search && {
      OR: [
        { entityName: { contains: search } },
        { contactPerson: { contains: search } },
        { phone: { contains: search } },
        { user: { phone: { contains: search } } },
        { user: { email: { contains: search } } },
      ],
    }),
  };

  const [customers, total] = await Promise.all([
    customerRepository.findCustomers({
      where,
      skip: paginationParams.skip,
      take: paginationParams.limit,
    }),
    customerRepository.countCustomers(where),
  ]);

  return {
    data: customers,
    pagination: buildPagination(paginationParams.page, paginationParams.limit, total),
  };
};

const getCustomerById = async ({ id }) => {
  const customer = await customerRepository.findCustomerByIdWithDetails(id);

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  return customer;
};

const updateCustomer = async ({ id, entityName, contactPerson, phone }) => {
  const existingCustomer = await customerRepository.findCustomerById(id);

  if (!existingCustomer) {
    throw new NotFoundError('Customer not found');
  }

  const updateData = {};
  if (entityName !== undefined) updateData.entityName = entityName;
  if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
  if (phone !== undefined) updateData.phone = phone;

  return customerRepository.updateCustomer(id, updateData);
};

const deleteCustomer = async ({ id }) => {
  const existingCustomer = await customerRepository.findCustomerById(id);

  if (!existingCustomer) {
    throw new NotFoundError('Customer not found');
  }

  await customerRepository.deleteCustomer(id);
};

module.exports = {
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
