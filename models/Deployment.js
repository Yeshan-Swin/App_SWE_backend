const { Schema, model } = require('mongoose');
const { randomUUID } = require('crypto');

const deploymentSchema = new Schema(
  {
    id: {
      type: String,
      default: () => randomUUID(),
      unique: true,
      index: true,
    },
    environment: {
      type: String,
      required: true,
      index: true,
    },
    branch: {
      type: String,
      required: true,
    },
    commit: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'in_progress', 'success', 'failed'],
    },
    deployedBy: {
      type: String,
      required: true,
    },
    durationSeconds: {
      type: Number,
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    collection: 'deployments',
    versionKey: false,
  }
);

deploymentSchema.set('toJSON', {
  transform: (_, doc) => {
    const { _id, createdAt, deployedBy, durationSeconds, ...rest } = doc;
    return {
      ...rest,
      deployed_by: deployedBy,
      duration_seconds: durationSeconds,
      created_at: createdAt?.toISOString(),
    };
  },
});

module.exports = model('Deployment', deploymentSchema);
