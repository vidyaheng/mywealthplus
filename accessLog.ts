import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
  time: { type: Date, default: Date.now },
  ip: String,
  pin: String,
  success: Boolean,
  userAgent: String,
});

export default mongoose.model('AccessLog', LogSchema);