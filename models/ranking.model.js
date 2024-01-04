const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const rankingSchema = mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    keywords: {
      type: String,
      required: true,
    },
    rank: {
      type: Number,
      required: true,
      default: 0,
    },
    prevRank: {
      type: Number
    },
    active: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      required: true,
    },
    trackingRequested: {
      type: Boolean,
      default: false,
    },
    trackingStatus: {
      type: String,
      enum: ['REQUESTED', 'DONE'],
    },
    slot1: Number,
    slot2: Number,
    mid1: String,
    mid2: String,
    expiresOn: Date,
    requestMessage: String,
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
rankingSchema.plugin(toJSON);
rankingSchema.plugin(paginate);

/**
 * @typedef Ranking
 */
const Ranking = mongoose.model('Ranking', rankingSchema);

module.exports = Ranking;
