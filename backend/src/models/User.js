const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: false },
    email: { type: String, required: false, index: true, unique: false }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);

