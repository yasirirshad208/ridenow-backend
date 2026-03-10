const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI;
  const fallbackUri = process.env.MONGODB_URI_FALLBACK;

  if (!primaryUri) {
    console.error('Database connection error: MONGODB_URI is not set');
    process.exit(1);
  }

  try {
    await mongoose.connect(primaryUri);
    console.log(`MongoDB Connected`);
  } catch (error) {
    const isSrvDnsFailure =
      error &&
      error.code === 'ECONNREFUSED' &&
      error.syscall === 'querySrv';

    if (isSrvDnsFailure && fallbackUri) {
      try {
        await mongoose.connect(fallbackUri);
        console.log('MongoDB Connected (fallback URI)');
        return;
      } catch (fallbackError) {
        console.error('Database connection error (fallback failed):', fallbackError);
        process.exit(1);
      }
    }

    if (isSrvDnsFailure) {
      console.error(
        'SRV DNS lookup failed for your Atlas URI. Set MONGODB_URI_FALLBACK with a non-SRV mongodb:// URI and retry.'
      );
    }

    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
