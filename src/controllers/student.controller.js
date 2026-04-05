/**
 * Student Controller
 * Handles student-related HTTP requests (Admin only for CRUD)
 */

const studentService = require('../services/studentService');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getStudents = async (req, res, next) => {
  try {
    const result = await studentService.getStudents(req.query);
    sendPaginated(res, result.data, result.pagination, 'Students retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getStudentById = async (req, res, next) => {
  try {
    const student = await studentService.getStudentById({
      id: req.params.id,
    });

    sendSuccess(res, student, 'Student retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const student = await studentService.updateStudent({
      id: req.params.id,
      ...req.body,
    });

    sendSuccess(res, student, 'Student updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    await studentService.deleteStudent({
      id: req.params.id,
    });

    sendSuccess(res, null, 'Student deleted successfully', 204);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
};
