/**
 * File Upload Service
 * Handles file uploads using Multer
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config/env');
const { generateFileName, isAllowedFileType, getFileExtension } = require('../utils/helpers');

// Ensure uploads directory exists
const ensureUploadDir = async () => {
  try {
    await fs.access(config.uploadDir);
  } catch {
    await fs.mkdir(config.uploadDir, { recursive: true });
  }
};

// Initialize upload directory
ensureUploadDir();

// Configure storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir();
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const fileName = generateFileName(file.originalname);
    cb(null, fileName);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (isAllowedFileType(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${config.allowedFileTypes.join(', ')}`), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize,
  },
});

/**
 * Single file upload middleware
 */
const singleUpload = (fieldName = 'file') => {
  return upload.single(fieldName);
};

/**
 * Multiple files upload middleware
 */
const multipleUpload = (fieldName = 'files', maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};

/**
 * Delete file
 */
const deleteFile = async (fileName) => {
  try {
    const filePath = path.join(config.uploadDir, fileName);
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    console.error('File delete error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get file URL
 */
const getFileUrl = (fileName) => {
  if (!fileName) return null;
  if (fileName.startsWith('http')) return fileName; // Already a full URL
  return `${config.backendUrl}/uploads/${fileName}`;
};

/**
 * Get file path
 */
const getFilePath = (fileName) => {
  return path.join(config.uploadDir, fileName);
};

module.exports = {
  singleUpload,
  multipleUpload,
  deleteFile,
  getFileUrl,
  getFilePath,
  upload,
};

