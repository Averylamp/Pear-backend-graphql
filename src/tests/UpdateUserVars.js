import {
  AVERY_ID, BRIAN_ID, JOEL_ID, JOSH_ID, MADE_ID, SAMMI_ID, SOPHIA_ID, UMA_ID,
} from './TestsContants';

export const UPDATE_AVERY_USER_VARIABLES = {
  updateUserInput: {
    user_id: AVERY_ID,
    gender: 'male',
    age: 21,
    ethnicity: ['OTHER'],
    ethnicityVisible: false,
    politicalView: 'LIBERAL',
    politicalViewVisible: true,
    smoking: 'SOMETIMES',
    drugs: 'NO',
    drugsVisible: false,
    school: 'MIT',
    isSeeking: true,
    seekingGender: ['female'],
    location: [-71.101366, 42.362580],
  },
};

export const UPDATE_BRIAN_USER_VARIABLES = {
  updateUserInput: {
    user_id: BRIAN_ID,
    gender: 'male',
    age: 21,
    ethnicity: ['EAST_ASIAN'],
    ethnicityVisible: true,
    school: 'MIT',
    work: 'Pear',
    isSeeking: true,
    seekingGender: ['female'],
    location: [-71.101366, 42.362580],
    firebaseRemoteInstanceID: 'dOqbe3RzyeA:APA91bExHrFvWL7XAjhQg4-A8WJnnVyVtUy8MgVh0HV2CbAP28YuKgpcUQTpIFElEf5hbjLk3weNGywDaHHl7cqw4U6QNFWtIXr8rDhJpmZacPS5fplm6HNYQYCqq0UPjH90dI04G0AI',
  },
};

export const UPDATE_JOEL_USER_VARIABLES = {
  updateUserInput: {
    user_id: JOEL_ID,
    gender: 'male',
    age: 27,
    school: 'Stanford',
    isSeeking: false,
    seekingGender: ['male'],
    location: [-122.422484, 37.751370],
  },
};

export const UPDATE_JOSH_USER_VARIABLES = {
  updateUserInput: {
    user_id: JOSH_ID,
    gender: 'male',
    age: 20,
    school: 'harvard',
    hometown: 'San Diego',
    jobTitle: 'CMO',
    isSeeking: true,
    seekingGender: ['male'],
    location: [-71.332174, 42.299819],
  },
};

export const UPDATE_SAMMI_USER_VARIABLES = {
  updateUserInput: {
    user_id: SAMMI_ID,
    gender: 'female',
    age: 19,
    school: 'mass tech',
    isSeeking: true,
    seekingGender: ['male'],
    location: [-71.098088, 42.355988],
  },
};

export const UPDATE_MADE_USER_VARIABLES = {
  updateUserInput: {
    user_id: MADE_ID,
    gender: 'female',
    age: 20,
    school: 'Harvard',
    isSeeking: false,
    seekingGender: ['male'],
    location: [-71.116492, 42.373999],
    firebaseRemoteInstanceID: 'fMbqTzGeW3k:APA91bHn1m1qKrq87fGU_F9RpHbFXzcrB6X3-5iKcdUdG4her3T7nOyIxzF1SgDFqJKnL-luIZfArcelsU-9yzwhM8XRycrzMbRJhCeoQYb9h05VpuVcKCDjgseWJjkc2NHqUhDjKa9w',
  },
};

export const UPDATE_UMA_USER_VARIABLES = {
  updateUserInput: {
    user_id: UMA_ID,
    gender: 'female',
    age: 21,
    isSeeking: true,
    seekingGender: ['male', 'female', 'nonbinary'],
    location: [-71.226725, 42.444342],
    maxDistance: 5,
  },
};

export const UPDATE_SOPHIA_USER_VARIABLES = {
  updateUserInput: {
    user_id: SOPHIA_ID,
    gender: 'female',
    age: 21,
    school: 'MIT',
    isSeeking: false,
    seekingGender: ['male'],
    location: [-71.116492, 42.373999],
    firebaseRemoteInstanceID: 'faBZOThoNlU:APA91bEbDB-QNxKE5aOYhvUJdwEJjsAbE1h8jih-2EgbXUEpsLbGL4e0SUO-5NATRmeXNrNKml2qirVBsc_S3bxvqGeBbIUejWAUKuffrz1QsKEDmPYZSzZzRiG4pvS-aiN7jRlndC3K',
  },
};
