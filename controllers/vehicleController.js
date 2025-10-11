const Vehicle = require('../models/Vehicle');
const path = require('path'); // For path handling

exports.getAllVehicles = async (req, res, next) => {
  try {
    // Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Default: show all vehicles (for admin). Public sees available only.
    let query = {};

    // Check if it's admin view
    const isAdminView = req.query.showUnavailable === 'true' || req.query.adminView === 'true';
    if (!isAdminView) {
      query.availability = true; // Default: only available vehicles
    }

    // Filter by type
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Filter by price range
    if (req.query.minPrice || req.query.maxPrice) {
      query.pricePerDay = {};
      if (req.query.minPrice) query.pricePerDay.$gte = parseInt(req.query.minPrice);
      if (req.query.maxPrice) query.pricePerDay.$lte = parseInt(req.query.maxPrice); // ✅ Fixed typo (was req.maxPrice)
    }

    // Filter by brand
    if (req.query.brand) {
      query.brand = new RegExp(req.query.brand, 'i');
    }

    // Filter by fuel type
    if (req.query.fuelType) {
      query.fuelType = req.query.fuelType;
    }

    // Filter by transmission
    if (req.query.transmission) {
      query.transmission = req.query.transmission;
    }

    // Explicit availability filter (overrides default)
    if (req.query.availability !== undefined && req.query.availability !== '') {
      query.availability = req.query.availability === 'true';
    }

    // Search by name, description, brand, or model
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { model: searchRegex }
      ];
    }

    // Fetch paginated results
    const vehicles = await Vehicle.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Count total documents
    const total = await Vehicle.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Response
    res.status(200).json({
      success: true,
      count: vehicles.length,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      data: vehicles
    });
  } catch (error) {
    next(error);
  }
};



exports.getVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({ slug: req.params.slug });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};


exports.createVehicle = async (req, res, next) => {
  try {
    // Extract text fields from req.body (parse features if JSON)
    let vehicleData = { ...req.body };
    if (vehicleData.features && typeof vehicleData.features === 'string') {
      try {
        vehicleData.features = JSON.parse(vehicleData.features); // Frontend sends as JSON string
      } catch (e) {
        vehicleData.features = vehicleData.features.split(',').map(f => f.trim()).filter(f => f); // Fallback to comma-separated
      }
    }

    // Handle images: Build paths array from req.files (Multer)
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const imagePath = `/uploads/${file.filename}`; // Relative path for frontend serving
        images.push(imagePath);
      });
      vehicleData.images = images;
    }

    // Create vehicle with all data (including images paths)
    const vehicle = await Vehicle.create(vehicleData);
    
    res.status(201).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        require('fs').unlinkSync(`uploads/vehicles/${file.filename}`);
      });
    }
    next(error);
  }
};

exports.updateVehicle = async (req, res, next) => {
  try {
    // Fetch existing vehicle to preserve data
    const existingVehicle = await Vehicle.findById(req.params.id);
    if (!existingVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Extract text fields from req.body (parse features if JSON)
    let updateData = { ...req.body };
    if (updateData.features && typeof updateData.features === 'string') {
      try {
        updateData.features = JSON.parse(updateData.features);
      } catch (e) {
        updateData.features = updateData.features.split(',').map(f => f.trim()).filter(f => f);
      }
    }

    // Handle images: If new files uploaded, append/replace
    let images = existingVehicle.images || [];
    if (req.files && req.files.length > 0) {
      // Optional: Delete old images if replacing (uncomment if needed)
      // existingVehicle.images.forEach(imgPath => {
      //   const fullPath = path.join(__dirname, '..', '..', imgPath);
      //   require('fs').unlink(fullPath, (err) => { if (err) console.log('Delete old image error:', err); });
      // });
      
      req.files.forEach(file => {
        const imagePath = `/uploads/vehicles/${file.filename}`;
        images.push(imagePath);
      });
      updateData.images = images; // Update the array
    }

    // Update vehicle
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Optional: Delete associated images from disk
    if (vehicle.images && vehicle.images.length > 0) {
      vehicle.images.forEach(imgPath => {
        const fullPath = path.join(__dirname, '..', '..', imgPath.replace('/uploads/vehicles/', ''));
        require('fs').unlink(fullPath, (err) => {
          if (err) console.error('Error deleting image:', err);
        });
      });
    }

    await Vehicle.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
