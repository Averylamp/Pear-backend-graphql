import gql from 'graphql-tag';

export const ADD_QUESTIONS = gql`
  mutation AddQuestions($newQuestions: [NewQuestionInput!]!) {
    addQuestions(newQuestions: $newQuestions) {
      questionText
      questionTextWithName
      questionType
      suggestedResponses {
        responseBody
        responseTitle
        color {
          red
          blue
          green
          alpha
        }
        icon {
          assetString
          assetURL
        }
      }
      hiddenInQuestionnaire
      hiddenInProfile
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($userInput: CreationUserInput!) {
    createUser(userInput: $userInput) {
      success
      message
      user {
        _id
        deactivated
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
        pearPoints
      }
    }
  }
`;

export const CREATE_DETACHED_PROFILE = gql`
  mutation CreateDetachedProfile($detachedProfileInput: CreationDetachedProfileInput!) {
    createDetachedProfile(detachedProfileInput: $detachedProfileInput) {
      success
      message
      detachedProfile {
        _id
        creatorUser_id
        firstName
        phoneNumber
        status
        boasts {
          _id
          authorFirstName
          content
        }
        roasts {
          _id
          authorFirstName
          content
        }
        vibes {
          _id
          authorFirstName
          content
        }
        interests {
          _id
          authorFirstName
          content
        }
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
        boasts {
          _id
          authorFirstName
          content
        }
        roasts {
          _id
          authorFirstName
          content
        }
        questionResponses {
          _id
          authorFirstName
          question {
            questionText
          }
          responseBody
        }
        vibes {
          _id
          authorFirstName
          content
        }
        bio {
          _id
          authorFirstName
          content
        }
        dos {
          _id
          authorFirstName
          content
        }
        donts {
          _id
          authorFirstName
          content
        }
        interests {
          _id
          authorFirstName
          content
        }
        images {
          imageID
          uploadedByUser {
            firstName
          }
        }
      }
    }
  }
`;

export const ATTACH_DETACHED_PROFILE = gql`
  mutation ApproveNewDetachedProfile($approveDetachedProfileInput: ApproveDetachedProfileInput!) {
    approveNewDetachedProfile(approveDetachedProfileInput: $approveDetachedProfileInput) {
      success
      message
      user {
        _id
        fullName
        endorser_ids
        boasts {
          _id
          authorFirstName
          content
        }
        roasts {
          _id
          authorFirstName
          content
        }
        vibes {
          _id
          authorFirstName
          content
        }
        bios {
          _id
          authorFirstName
          content
        }
      }
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($updateUserInput: UpdateUserInput!) {
    updateUser(updateUserInput: $updateUserInput) {
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
  mutation UpdatePhotos($updateUserPhotosInput: UpdateUserPhotosInput!) {
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
