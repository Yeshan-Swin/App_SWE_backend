const { Schema, model } = require('mongoose');
const { randomUUID } = require('crypto');

const groupSchema = new Schema(
  {
    id: {
      type: String,
      default: () => randomUUID(),
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    memberIds: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    collection: 'groups',
    versionKey: false,
  }
);

groupSchema.set('toJSON', {
  transform: (_, doc) => {
    const { _id, createdAt, memberIds, ownerId, ...rest } = doc;
    return {
      ...rest,
      owner_id: ownerId,
      member_ids: memberIds ?? [],
      created_at: createdAt?.toISOString(),
    };
  },
});

module.exports = model('Group', groupSchema);
