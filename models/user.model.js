const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      private: true, // used by the toJSON plugin
    },
    role: {
      type: String,
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    nickname: {
      type: String,
      required: true,
    },
    telegramId: {
      type: String,
    },
    telegramUUID: {
      type: Number
    },
    phone: {
      type: String,
    },
    hasDroppedMessage: {
      type: Boolean,
      default: false,
      index: true,
    },
    hasUnreadMessage: {
      type: Boolean,
      default: false,
      index: true,
    },
    points: {
      type: Number,
      default: 0,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
