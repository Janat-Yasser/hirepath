const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const upload = require('../middleware/upload');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', jobController.listJobs);
router.get('/search.json', jobController.searchJobsJson);
router.get('/:id', jobController.showJob);
router.post(
  '/:id/apply',
  protect,
  restrictTo('user'),
  (req, res, next) => {
    upload.single('resume')(req, res, (err) => {
      if (err) {
        return res.status(400).render('error', {
          title: 'Upload error',
          code: 400,
          message: err.message,
        });
      }
      next();
    });
  },
  jobController.applyToJob
);

module.exports = router;
