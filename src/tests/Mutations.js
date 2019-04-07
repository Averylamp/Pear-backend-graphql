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
        status
      }
    }
  }
`;

export const VIEW_DETACHED_PROFILE = gql`
  mutation ViewDetachedProfile($user_id: ID!, $detachedProfile_id: ID!) {
    viewDetachedProfile(user_id: $user_id, detachedProfile_id: $detachedProfile_id) {
      success
      message
      detachedProfile {
        _id
        creatorUser_id
        creatorFirstName
        firstName
        status
      }
    }
  }
`;

export const EDIT_DETACHED_PROFILE = gql`
  mutation EditDetachedProfile($editDetachedProfileInput: EditDetachedProfileInput!) {
    editDetachedProfile(editDetachedProfileInput: $editDetachedProfileInput) {
      success
      message
      detachedProfile {
        _id
        creatorUser_id
        creatorFirstName
        firstName
        status
        bio
        dos
        donts
        images {
          imageID
          uploadedByUser {
            firstName
          }
        }
        matchingDemographics {
          location {
            coords
            locationName
          }
        }
      }
    }
  }
`;

export const ATTACH_DETACHED_PROFILE = gql`
  mutation ApproveNewDetachedProfile($user_id: ID!, $detachedProfile_id: ID!, $creatorUser_id: ID!, $userProfile_id: ID) {
    approveNewDetachedProfile(user_id: $user_id, detachedProfile_id: $detachedProfile_id, creatorUser_id: $creatorUser_id, userProfile_id: $userProfile_id) {
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

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $updateUserInput: UpdateUserInput) {
    updateUser(id: $id, updateUserInput: $updateUserInput) {
      success
      message
      user {
        _id
        deactivated
        email
        phoneNumber
        fullName
        thumbnailURL
        school
        schoolEmail
        schoolEmailVerified
        birthdate
        isSeeking
      }
    }
  }
`;

export const UPDATE_DISPLAYED_PHOTOS = gql`
  mutation UpdatePhotos($updateUserPhotosInput: UpdateUserPhotosInput) {
    updateUserPhotos(updateUserPhotosInput: $updateUserPhotosInput) {
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

export const FORCE_FEED_UPDATE = gql`
  mutation ForceUpdateFeed($user_id: ID!, $numberOfItems: Int) {
    forceUpdateFeed(user_id: $user_id, numberOfItems: $numberOfItems) {
      success
      message
    }
  }
`;

export const CREATE_MATCH_REQUEST = gql`
  mutation CreateMatchRequest($requestInput: CreateMatchRequestInput!) {
    createMatchRequest(requestInput: $requestInput) {
      success
      message
      match {
        _id
        sentByUser {
          _id
          fullName
        }
        sentForUser {
          _id
          fullName
          requestedMatch_ids
          currentMatch_ids
          edgeUser_ids
        }
        receivedByUser {
          _id
          fullName
          requestedMatch_ids
          currentMatch_ids
          edgeUser_ids
        }
        sentForUserStatus
        receivedByUserStatus
      }
    }
  }
`;

export const ACCEPT_REQUEST = gql`
  mutation AcceptRequest($user_id: ID!, $match_id: ID!) {
    acceptRequest(user_id: $user_id, match_id: $match_id) {
      success
      message
      match {
        sentByUser {
          _id
          fullName
        }
        sentForUser {
          _id
          fullName
          requestedMatch_ids
          currentMatch_ids
          edgeUser_ids
        }
        receivedByUser {
          _id
          fullName
          requestedMatch_ids
          currentMatch_ids
          edgeUser_ids
        }
        sentForUserStatus
        receivedByUserStatus
      }
    }
  }
`;

export const REJECT_REQUEST = gql`
  mutation RejectRequest($user_id: ID!, $match_id: ID!) {
    rejectRequest(user_id: $user_id, match_id: $match_id) {
      success
      message
      match {
        sentByUser {
          _id
          fullName
        }
        sentForUser {
          _id
          fullName
          requestedMatch_ids
          currentMatch_ids
          edgeUser_ids
        }
        receivedByUser {
          _id
          fullName
          requestedMatch_ids
          currentMatch_ids
          edgeUser_ids
        }
        sentForUserStatus
        receivedByUserStatus
      }
    }
  }
`;

export const UNMATCH = gql`
  mutation Unmatch($user_id: ID!, $match_id: ID!, $reason: String) {
    unmatch(user_id: $user_id, match_id: $match_id, reason: $reason) {
      success
      message
      match {
        sentByUser {
          _id
          fullName
        }
        sentForUser {
          _id
          fullName
          requestedMatch_ids
          currentMatch_ids
          edgeUser_ids
        }
        receivedByUser {
          _id
          fullName
          requestedMatch_ids
          currentMatch_ids
          edgeUser_ids
        }
        sentForUserStatus
        receivedByUserStatus
        unmatched
        unmatchedBy_id
        unmatchedReason
      }
    }
  }
`;

export const EDIT_USER_PROFILE = gql`
  mutation EditUserProfile($editUserProfileInput: EditUserProfileInput!) {
    editUserProfile(editUserProfileInput: $editUserProfileInput) {
      success
      message
      userProfile {
        _id
        creatorUser_id
        creatorFirstName
      }
    }
  }
`;
