const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const historySchema = mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      index: true
    },
    ranking: {
      type: mongoose.Types.ObjectId,
      ref: 'Ranking',
      index: true
    },
    rank: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
historySchema.plugin(toJSON);
historySchema.plugin(paginate);

/**
 * @typedef History
 */
const History = mongoose.model('History', historySchema);

module.exports = History;
