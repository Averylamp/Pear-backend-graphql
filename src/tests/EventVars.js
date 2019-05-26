import { BRIAN_ID, EVENT0_ID, MADE_ID } from './TestsContants';

export const CREATE_EVENT0_VARIABLES = {
  eventInput: {
    _id: EVENT0_ID,
    code: 'TESTCODE',
    name: 'Test Event 5/15',
    startTime: '1557935220000',
    endTime: '1559935220000',
  },
};

export const CREATE_EVENT1_VARIABLES = {
  eventInput: {
    code: 'SUMMERLOVE',
    name: 'DateMyFriend.ppt 6/2',
    startTime: '1557935220000',
    endTime: '1559935220000',
  },
};

export const ADD_BRIAN_EVENT0 = {
  user_id: BRIAN_ID,
  code: 'TESTCODE',
};

export const ADD_MADE_EVENT0 = {
  user_id: MADE_ID,
  code: 'TESTCODE',
};
