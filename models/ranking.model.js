const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const rankingSchema = mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      index: true
    },
    url: {
      type: String,
      required: true
    },
    keywords: {
      type: String,
      required: true
    },
    rank: {
      type: Number,
      required: true
    },
    active: {
      type: Boolean,
      default: true
    }
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
