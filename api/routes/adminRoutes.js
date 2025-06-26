const express = require('express');
const { getAdminRequests, approveAdminRequest, rejectAdminRequest } = require('../controllers/adminController');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();

router.get('/requests', adminAuth, getAdminRequests);
router.post('/approve', adminAuth, approveAdminRequest);
router.post('/reject', adminAuth, rejectAdminRequest);

module.exports = router; 