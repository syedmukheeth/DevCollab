const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    github: {
      owner: { type: String, index: true },
      repo: { type: String, index: true },
      defaultBranch: { type: String, default: 'main' },
      createdAt: { type: Date }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Project', projectSchema);

