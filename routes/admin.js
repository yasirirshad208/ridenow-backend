const express = require('express');
const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  getAllReservations
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.get('/reservations', getAllReservations);

module.exports = router;