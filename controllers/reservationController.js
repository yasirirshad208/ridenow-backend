const Reservation = require('../models/Reservation');
const Vehicle = require('../models/Vehicle');

exports.createReservation = async (req, res, next) => {
  try {
    const { vehicleId, startDate, endDate, pickupLocation, dropoffLocation, specialRequests } = req.body;

    // Check if vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if vehicle is available
    if (!vehicle.availability) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is not available'
      });
    }

    // Check for date conflicts
    const existingReservation = await Reservation.findOne({
      vehicle: vehicleId,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) }
        }
      ]
    });

    if (existingReservation) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is already booked for the selected dates'
      });
    }

    // Calculate total cost
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalCost = days * vehicle.pricePerDay;

    const reservation = await Reservation.create({
      user: req.user.id,
      vehicle: vehicleId,
      startDate: start,
      endDate: end,
      totalCost,
      pickupLocation,
      dropoffLocation,
      specialRequests
    });

    // Populate the reservation with vehicle details
    await reservation.populate('vehicle');

    res.status(201).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ user: req.user.id })
      .populate('vehicle')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    next(error);
  }
};

exports.getReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate('vehicle').populate('user');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Check if user owns the reservation or is admin
    if (reservation.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this reservation'
      });
    }

    res.status(200).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Check if user owns the reservation or is admin
    if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this reservation'
      });
    }

    // Cannot cancel completed reservations
    if (reservation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed reservation'
      });
    }

    reservation.status = 'cancelled';
    await reservation.save();

    res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully',
      data: reservation
    });
  } catch (error) {
    next(error);
  }
};

exports.updateReservationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    reservation.status = status;
    await reservation.save();

    res.status(200).json({
      success: true,
      message: 'Reservation status updated successfully',
      data: reservation
    });
  } catch (error) {
    next(error);
  }
};



// Add this to your reservationController.js

exports.getRevenueStats = async (req, res, next) => {
  try {
    // Get total revenue from all completed reservations
    const totalRevenueResult = await Reservation.aggregate([
      {
        $match: {
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalCost' }
        }
      }
    ]);

    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0;

    // Get last 30 days of revenue grouped by day
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyRevenueData = await Reservation.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          revenue: { $sum: '$totalCost' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Format data for graph
    const graphData = monthlyRevenueData.map(item => ({
      date: item._id,
      revenue: item.revenue,
      reservations: item.count
    }));

    // Calculate last month total
    const lastMonthTotal = monthlyRevenueData.reduce((sum, item) => sum + item.revenue, 0);

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        lastMonthRevenue: lastMonthTotal,
        graphData,
        period: {
          from: thirtyDaysAgo.toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0]
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
