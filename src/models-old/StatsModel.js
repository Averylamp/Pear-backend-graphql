import { dbOld } from '../migrations/migration1/migration1Setup';

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

export const StatSnapshotOld = dbOld.model('StatSnapshot', StatSnapshotSchema);

export const createStatSnapshot = (statInput) => {
  const statSnapshotModel = new StatSnapshotOld(statInput);
  statSnapshotModel.save();
};
