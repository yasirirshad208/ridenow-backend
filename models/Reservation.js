const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  pickupLocation: {
    type: String,
    trim: true
  },
  dropoffLocation: {
    type: String,
    trim: true
  },
  specialRequests: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

reservationSchema.pre('save', function(next) {
  if (this.isModified('startDate') || this.isModified('endDate')) {
    const days = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
    this.totalCost = days * this.vehicle.pricePerDay;
  }
  next();
});

module.exports = mongoose.model('Reservation', reservationSchema);