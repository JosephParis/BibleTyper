import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  translation: {
    type: String,
    required: true,
    default: 'niv',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

settingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Settings = mongoose.model('Settings', settingsSchema); 