export const resolvers = {
  Location: {
    coords: async ({ point }) => point.coordinates,
    coordsLastUpdated: async ({ point }) => point.updatedAt,
    locationName: async ({ locationName }) => (locationName ? locationName.name : null),
    locationNameLastUpdated: async ({ locationName }) => (locationName
      ? locationName.updatedAt
      : null),
  },
};
