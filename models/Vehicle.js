const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  slug: {
    type: String,
    required: true
  },
  pricePerDay: {
    type: Number,
    required: true,
    min: 0
  },
  availability: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  },
  features: [String],
  images: [String],
  seatingCapacity: {
    type: Number,
    required: true,
    min: 1
  },
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel', 'electric', 'hybrid'],
    required: true
  },
  transmission: {
    type: String,
    enum: ['manual', 'automatic'],
    required: true
  },
  mileage: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Vehicle', vehicleSchema);