// Copyright (c) 2026 Janat Yasser. All rights reserved.
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('admin'));

router.get('/resumes/:filename', adminController.downloadResume);
router.get('/', adminController.dashboard);
router.get('/jobs/new', adminController.newJobForm);
router.post('/jobs', adminController.createJob);
router.get('/jobs/:id/edit', adminController.editJobForm);
router.put('/jobs/:id', adminController.updateJob);
router.delete('/jobs/:id', adminController.deleteJob);
router.get('/jobs/:id/applications', adminController.viewApplications);
router.get('/jobs/:id/pipeline', adminController.viewPipeline);
router.put('/applications/:appId/status', adminController.updateApplicationStatus);
router.post('/applications/:appId/move', adminController.moveApplication);

module.exports = router;
