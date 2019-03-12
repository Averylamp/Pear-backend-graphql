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
  mutation ApproveNewDetachedProfile($user_id: ID!, $detachedProfile_id: ID!, $creator_id: ID!) {
    approveNewDetachedProfile(user_id: $user_id, detachedProfile_id: $detachedProfile_id, creator_id: $creator_id) {
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

export const CREATE_AVERY_USER_VARIABLES = {
  userInput: {
    _id: '5c82162afec46c84e924a332',
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
    _id: '5c82162afec46c84e924abcd',
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
    images: [
      {
        imageID: 'image1',
        original: {
          imageURL: 'https://scontent.fbed1-1.fna.fbcdn.net/v/t1.0-9/28279134_1636086206467671_3416662694523695438_n.jpg?_nc_cat=100&_nc_ht=scontent.fbed1-1.fna&oh=4a3dadd50b9104efffa1ead649e8e25e&oe=5D0CAC8D',
          width: 1500,
          height: 1500,
          imageType: 'original',
        },
        large: {
          imageURL: 'https://scontent.fbed1-1.fna.fbcdn.net/v/t1.0-9/28279134_1636086206467671_3416662694523695438_n.jpg?_nc_cat=100&_nc_ht=scontent.fbed1-1.fna&oh=4a3dadd50b9104efffa1ead649e8e25e&oe=5D0CAC8D',
          width: 1000,
          height: 1000,
          imageType: 'large',
        },
        medium: {
          imageURL: 'https://scontent.fbed1-1.fna.fbcdn.net/v/t1.0-9/28279134_1636086206467671_3416662694523695438_n.jpg?_nc_cat=100&_nc_ht=scontent.fbed1-1.fna&oh=4a3dadd50b9104efffa1ead649e8e25e&oe=5D0CAC8D',
          width: 600,
          height: 600,
          imageType: 'medium',
        },
        small: {
          imageURL: 'https://scontent.fbed1-1.fna.fbcdn.net/v/t1.0-9/28279134_1636086206467671_3416662694523695438_n.jpg?_nc_cat=100&_nc_ht=scontent.fbed1-1.fna&oh=4a3dadd50b9104efffa1ead649e8e25e&oe=5D0CAC8D',
          width: 300,
          height: 300,
          imageType: 'small',
        },
        thumbnail: {
          imageURL: 'https://scontent.fbed1-1.fna.fbcdn.net/v/t1.0-9/28279134_1636086206467671_3416662694523695438_n.jpg?_nc_cat=100&_nc_ht=scontent.fbed1-1.fna&oh=4a3dadd50b9104efffa1ead649e8e25e&oe=5D0CAC8D',
          width: 150,
          height: 150,
          imageType: 'thumbnail',
        },
        uploadedByUser_id: '5c82162afec46c84e924a333',
      }],
  },
};

export const ATTACH_AVERY_PROFILE_VARIABLES = {
  user_id: '5c82162afec46c84e924a332',
  detachedProfile_id: '5c82162afec46c84e924abcd',
  creator_id: '5c82162afec46c84e924a333',
};

export const ADD_AVERY_PHOTOS_VARIABLES = {
  updateUserPhotosInput: {
    user_id: '5c82162afec46c84e924a332',
    displayedImages: [
      {
        imageID: 'image2',
        original: {
          imageURL: 'image2url',
          width: 1500,
          height: 1500,
          imageType: 'original',
        },
        large: {
          imageURL: 'image2url',
          width: 1000,
          height: 1000,
          imageType: 'large',
        },
        medium: {
          imageURL: 'image2url',
          width: 600,
          height: 600,
          imageType: 'medium',
        },
        small: {
          imageURL: 'image2url',
          width: 300,
          height: 300,
          imageType: 'small',
        },
        thumbnail: {
          imageURL: 'image2url',
          width: 150,
          height: 150,
          imageType: 'thumbnail',
        },
        uploadedByUser_id: '5c82162afec46c84e924a332',
      },
      {
        imageID: 'image1',
        original: {
          imageURL: 'https://scontent.fbed1-1.fna.fbcdn.net/v/t1.0-9/28279134_1636086206467671_3416662694523695438_n.jpg?_nc_cat=100&_nc_ht=scontent.fbed1-1.fna&oh=4a3dadd50b9104efffa1ead649e8e25e&oe=5D0CAC8D',
          width: 1500,
          height: 1500,
          imageType: 'original',
        },
        large: {
          imageURL: 'https://scontent.fbed1-1.fna.fbcdn.net/v/t1.0-9/28279134_1636086206467671_3416662694523695438_n.jpg?_nc_cat=100&_nc_ht=scontent.fbed1-1.fna&oh=4a3dadd50b9104efffa1ead649e8e25e&oe=5D0CAC8D',
          width: 1000,
          height: 1000,
          imageType: 'large',
        },
        medium: {
          imageURL: 'https://scontent.fbed1-1.fna.fbcdn.net/v/t1.0-9/28279134_1636086206467671_3416662694523695438_n.jpg?_nc_cat=100&_nc_ht=scontent.fbed1-1.fna&oh=4a3dadd50b9104efffa1ead649e8e25e&oe=5D0CAC8D',
          width: 600,
          height: 600,
          imageType: 'medium',
        },
        small: {
          imageURL: 'https://scontent.fbed1-1.fna.fbcdn.net/v/t1.0-9/28279134_1636086206467671_3416662694523695438_n.jpg?_nc_cat=100&_nc_ht=scontent.fbed1-1.fna&oh=4a3dadd50b9104efffa1ead649e8e25e&oe=5D0CAC8D',
          width: 300,
          height: 300,
          imageType: 'small',
        },
        thumbnail: {
          imageURL: 'https://scontent.fbed1-1.fna.fbcdn.net/v/t1.0-9/28279134_1636086206467671_3416662694523695438_n.jpg?_nc_cat=100&_nc_ht=scontent.fbed1-1.fna&oh=4a3dadd50b9104efffa1ead649e8e25e&oe=5D0CAC8D',
          width: 150,
          height: 150,
          imageType: 'thumbnail',
        },
        uploadedByUser_id: '5c82162afec46c84e924a333',
      },
    ],
    additionalImages: [
      {
        imageID: 'image3',
        original: {
          imageURL: 'image3url',
          width: 1500,
          height: 1500,
          imageType: 'original',
        },
        large: {
          imageURL: 'image3url',
          width: 1000,
          height: 1000,
          imageType: 'large',
        },
        medium: {
          imageURL: 'image3url',
          width: 600,
          height: 600,
          imageType: 'medium',
        },
        small: {
          imageURL: 'image3url',
          width: 300,
          height: 300,
          imageType: 'small',
        },
        thumbnail: {
          imageURL: 'image3url',
          width: 150,
          height: 150,
          imageType: 'thumbnail',
        },
        uploadedByUser_id: '5c82162afec46c84e924a332',
      },
    ],
  },
};
