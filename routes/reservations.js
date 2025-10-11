const express = require('express');
const {
  createReservation,
  getUserReservations,
  getReservation,
  cancelReservation,
  updateReservationStatus
} = require('../controllers/reservationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createReservation)
  .get(getUserReservations);

router.route('/:id')
  .get(getReservation)
  .put(cancelReservation);

router.route('/:id/status')
  .put(protect, authorize('admin'), updateReservationStatus);

module.exports = router;