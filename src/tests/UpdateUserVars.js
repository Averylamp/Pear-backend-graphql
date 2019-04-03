import { BRIAN_ID, JOEL_ID } from './TestsContants';

export const UPDATE_BRIAN_VARIABLES = {
  id: BRIAN_ID,
  updateUserInput: {
    location: [-69.101366, 43.362580],
    seekingGender: ['female'],
    locationName: 'Boston',
    firebaseRemoteInstanceID: 'testasdf',
    school: 'M.I.T.',
    isSeeking: false,
    schoolYear: '2020',
  },
};

export const UPDATE_JOEL_VARIABLES = {
  id: JOEL_ID,
  updateUserInput: {
    locationName: 'San Francisco',
    minAgeRange: 25,
    maxAgeRange: 30,
    deactivated: true,
  },
};
