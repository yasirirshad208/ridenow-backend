const express = require('express');
const {
  getAllVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle
} = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.route('/')
  .get(getAllVehicles)
  .post(protect, authorize('admin'), upload.array('images', 5), createVehicle);

router.route('/:slug')
  .get(getVehicle)

router.route('/:id')
  .put(protect, authorize('admin'), upload.array('images'), updateVehicle)
  .delete(protect, authorize('admin'), deleteVehicle);

module.exports = router;