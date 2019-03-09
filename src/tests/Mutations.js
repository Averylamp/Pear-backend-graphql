import * as gql from 'graphql-tag';

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
