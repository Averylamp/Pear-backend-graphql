import { EventModel } from '../../models/EventModel';
import { EVENT_NOT_FOUND, GET_USER_ERROR } from '../ResolverErrorStrings';
import { User } from '../../models/UserModel';

export const addEventCodeResolver = async ({ user_id, code }) => {
  const event = await EventModel.findOne({ code });
  if (!event) {
    return {
      success: false,
      message: EVENT_NOT_FOUND,
    };
  }
  const user = await User.findById(user_id);
  if (!user) {
    return {
      success: false,
      message: GET_USER_ERROR,
    };
  }
  if (!user.event_ids.map(event_id => event_id.toString()).includes(event._id.toString())) {
    user.event_ids.push(event._id.toString());
  }
  const updatedUser = await user.save();
  return {
    success: true,
    user: updatedUser,
  };
};
