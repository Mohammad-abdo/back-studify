/**
 * Doctor Controller
 * Handles doctor-related HTTP requests (Admin only for CRUD)
 */

const doctorService = require('../services/doctorService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getDoctors = async (req, res, next) => {
  try {
    const result = await doctorService.getDoctors(req.query);
    sendPaginated(res, result.data, result.pagination, 'Doctors retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await doctorService.getDoctorById({
      id: req.params.id,
    });

    sendSuccess(res, doctor, 'Doctor retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateDoctor = async (req, res, next) => {
  try {
    const doctor = await doctorService.updateDoctor({
      id: req.params.id,
      name: req.body.name,
      specialization: req.body.specialization,
    });

    sendSuccess(res, doctor, 'Doctor updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteDoctor = async (req, res, next) => {
  try {
    await doctorService.deleteDoctor({
      id: req.params.id,
    });

    sendSuccess(res, null, 'Doctor deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

const getDoctorStats = async (req, res, next) => {
  try {
    const stats = await doctorService.getDoctorStats({
      user: req.user,
      params: req.params,
    });

    sendSuccess(res, stats, 'Doctor statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getDoctorStats,
};
