const { Schema, model } = require('mongoose');
const { randomUUID } = require('crypto');

const eventSchema = new Schema(
  {
    id: {
      type: String,
      default: () => randomUUID(),
      unique: true,
      index: true,
    },
    groupId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    location: {
      type: String,
    },
    start: {
      type: String,
      required: true,
    },
    end: {
      type: String,
      required: true,
    },
    attendees: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    collection: 'events',
    versionKey: false,
  }
);

eventSchema.set('toJSON', {
  transform: (_, doc) => {
    const { _id, createdAt, createdBy, groupId, ...rest } = doc;
    return {
      ...rest,
      group_id: groupId,
      created_by: createdBy,
      created_at: createdAt?.toISOString(),
    };
  },
});

module.exports = model('Event', eventSchema);
