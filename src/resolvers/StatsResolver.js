import { StatSnapshot } from '../models/StatsModel';

export const resolvers = {
  Query: {
    getStatsSince: async (_source, { timestamp }) => {
      const date = new Date(parseInt(timestamp, 10));
      const summaries = await StatSnapshot.find({
        createdAt: { $gte: date },
      });
      return summaries;
    },
  },
};
