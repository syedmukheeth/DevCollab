const mongoose = require('mongoose');

const yjsSnapshotSchema = new mongoose.Schema(
  {
    room: { type: String, required: true, unique: true, index: true },
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', index: true },
    state: { type: Buffer, required: true },
    stateVersion: { type: Number, default: 1 }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('YjsSnapshot', yjsSnapshotSchema);

