const { Schema, model } = require('mongoose');

const passwordSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    collection: 'passwords',
    versionKey: false,
  }
);

passwordSchema.set('toJSON', {
  transform: (_, doc) => {
    const { _id, ...rest } = doc;
    return rest;
  },
});

module.exports = model('Password', passwordSchema);
