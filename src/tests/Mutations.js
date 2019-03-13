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
        fullName
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

export const ATTACH_DETACHED_PROFILE = gql`
  mutation ApproveNewDetachedProfile($user_id: ID!, $detachedProfile_id: ID!, $creatorUser_id: ID!) {
    approveNewDetachedProfile(user_id: $user_id, detachedProfile_id: $detachedProfile_id, creatorUser_id: $creatorUser_id) {
      success
      message
      user {
        _id
        fullName
        profile_ids
      }
    }
  }
`;

export const UPDATE_DISPLAYED_PHOTOS = gql`
  mutation UpdatePhotos($updateUserPhotosInput: UpdateUserPhotosInput) {
    updatePhotos(updateUserPhotosInput: $updateUserPhotosInput) {
      success
      message
      user {
        _id
        fullName
        displayedImages {
          imageID
          original {
            imageURL
            width
            height
            imageType
          }
          uploadedByUser {
            _id
            fullName
          }
        }
        bankImages {
          imageID
          original {
            imageURL
            width
            height
            imageType
          }
          uploadedByUser {
            _id
            fullName
          }
        }
      }
    }
  }
`;
