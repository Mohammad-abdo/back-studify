/**
 * Upload Routes
 * Handles file uploads (images, files)
 */

const express = require('express');
const router = express.Router();
const { singleUpload, multipleUpload } = require('../services/fileUpload.service');
const { getFileUrl } = require('../services/fileUpload.service');
const authenticate = require('../middleware/auth.middleware');
const { uploadLimiter } = require('../middleware/rateLimit.middleware');
const { sendSuccess } = require('../utils/response');

/**
 * Upload single file/image
 */
router.post('/single', authenticate, uploadLimiter, singleUpload('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const fileUrl = getFileUrl(req.file.filename);
    
    sendSuccess(res, {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: fileUrl,
    }, 'File uploaded successfully');
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error.message,
    });
  }
});

/**
 * Upload multiple files/images
 */
router.post('/multiple', authenticate, uploadLimiter, multipleUpload('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: getFileUrl(file.filename),
    }));
    
    sendSuccess(res, {
      files: uploadedFiles,
      count: uploadedFiles.length,
    }, 'Files uploaded successfully');
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Files upload failed',
      error: error.message,
    });
  }
});

module.exports = router;


