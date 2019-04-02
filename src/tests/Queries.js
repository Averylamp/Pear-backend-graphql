import gql from 'graphql-tag';

export const GET_USER = gql`
  query user($id: ID!) {
    user(id: $id) {
      deactivated
      firebaseToken
      firebaseAuthID
      facebookId
      facebookAccessToken
      email
      emailVerified
      phoneNumber
      phoneNumberVerified
      firstName
      lastName
      fullName
      thumbnailURL
      gender
      age
      birthdate
      locationName
      location
      school
      schoolEmail
      schoolEmailVerified
      pearPoints
      
      profileObjs {
        _id
        creatorObj {
          fullName
        }
      }
      
      endorsedProfileObjs {
        userObj {
          fullName
        }
      }
      
      detachedProfileObjs {
        firstName
        age
        gender
      }
      
      matchingPreferences {
        seekingGender
      }
    }
  }
`;
