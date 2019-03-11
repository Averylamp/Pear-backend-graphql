import gql from 'graphql-tag';

export const CREATE_USER = gql`
  mutation CreateUser($userInput: CreationUserInput) {
    createUser(userInput: $userInput) {
      success
      message
      user {
        _id
        deactivated
        firebaseToken
        firebaseAuthID
        facebookId
        facebookAccessToken
        email
        phoneNumber
        phoneNumberVerified
        firstName
        lastName
        thumbnailURL
        locationName
        locationCoordinates
        school
        schoolEmail
        schoolEmailVerified
        birthdate
        profile_ids
        endorsedProfile_ids
        pearPoints
      }
    }
  }
`;

export const CREATE_DETACHED_PROFILE = gql`
  mutation CreateDetachedProfile($detachedProfileInput: CreationDetachedProfileInput) {
    createDetachedProfile(detachedProfileInput: $detachedProfileInput) {
      success
      message
      detachedProfile {
        _id
        creatorUser_id
        firstName
        phoneNumber
        age
        gender
        interests
        vibes
        bio
        dos
        donts
      }
    }
  }
`;

export const CREATE_AVERY_USER_VARIABLES = {
  userInput: {
    age: 21,
    birthdate: '1/11/1998',
    email: 'averylamp@gmail.com',
    emailVerified: false,
    phoneNumber: '9738738225',
    phoneNumberVerified: false,
    firstName: 'Avery',
    lastName: 'Lamp',
    gender: 'male',
    firebaseToken: 'FakeFirebaseTokenAvery',
    firebaseAuthID: 'FakeFirebaseAuthIdAvery',
    // facebookId: '1',
    // facebookAccessToken: '2',
    thumbnailURL: '',
  },
};

export const CREATE_BRIAN_USER_VARIABLES = {
  userInput: {
    _id: '5c82162afec46c84e924a333',
    age: 20,
    birthdate: '3/15/1998',
    email: 'briangu33@gmail.com',
    emailVerified: false,
    phoneNumber: '2067789236',
    phoneNumberVerified: false,
    firstName: 'Brian',
    lastName: 'Gu',
    gender: 'male',
    firebaseToken: 'FakeFirebaseTokenBrian',
    firebaseAuthID: 'FakeFirebaseAuthIdBrian',
    // facebookId: '3',
    // facebookAccessToken: '4',
    thumbnailURL: '',
  },
};

export const CREATE_AVERY_DETACHED_PROFILE_VARIABLES = {
  detachedProfileInput: {
    creatorUser_id: '5c82162afec46c84e924a333',
    firstName: 'Avery',
    phoneNumber: '9738738225',
    age: 21,
    gender: 'male',
    interests: ['skiing', 'coding'],
    vibes: ['Forbidden Fruit', 'Happy Apple'],
    bio: 'This is my long bio',
    dos: ['feed him ramen', 'take him to the movies'],
    donts: ['feed him veggies'],
    images: [],
  },
};
