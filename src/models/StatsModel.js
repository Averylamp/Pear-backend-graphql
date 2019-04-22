const mongoose = require('mongoose');

const { Schema } = mongoose;

const StatTimeSummary = new Schema({
  lastDay: { type: Number, required: false },
  lastWeek: { type: Number, required: false },
  lastMonth: { type: Number, required: false }, // 30 days
  allTime: { type: Number, required: false },
});

const StatSnapshotSchema = new Schema({
  nUsers: { type: StatTimeSummary, required: false },
  nDetachedProfiles: { type: StatTimeSummary, required: false },
  nProfileApprovals: { type: StatTimeSummary, required: false },
  nPersonalMatchReqs: { type: StatTimeSummary, required: false },
  nMatchmakerMatchReqs: { type: StatTimeSummary, required: false },
  nPersonalMatchAccepted: { type: StatTimeSummary, required: false },
  nMatchmakerMatchAccepted: { type: StatTimeSummary, required: false },
}, { timestamps: true });

export const StatSnapshot = mongoose.model('StatSnapshot', StatSnapshotSchema);

export const createStatSnapshot = (statInput, skipTimestamps) => {
  const statSnapshotModel = new StatSnapshot(statInput);
  return statSnapshotModel.save({ timestamps: !skipTimestamps });
};
