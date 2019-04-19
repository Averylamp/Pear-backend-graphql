import { pick } from 'lodash';
import { User } from '../../models/UserModel';
import {
  ALREADY_MADE_PROFILE,
  CANT_ENDORSE_YOURSELF, CREATE_DETACHED_PROFILE_ERROR,
  GET_USER_ERROR,
} from '../ResolverErrorStrings';
import { createDetachedProfileObject, DetachedProfile } from '../../models/DetachedProfile';
import { UserProfile } from '../../models/UserProfileModel';
import { DiscoveryQueue } from '../../models/DiscoveryQueueModel';
import { NEW_PROFILE_BONUS } from '../../constants';
import { updateDiscoveryWithNextItem } from '../../discovery/DiscoverProfile';

const mongoose = require('mongoose');
const debug = require('debug')('dev:DetachedProfileResolvers');
const errorLog = require('debug')('error:DetachedProfileResolvers');

export const approveDetachedProfileResolver = async ({ detachedProfileInput }) => {

};
