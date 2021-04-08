import isEmpty from 'lodash/isEmpty';
import getRoleDescription from './getRuleDescription';
import RocketChat from '../../../lib/rocketchat';

const loadUser = async(room, roomUser) => {
	if (isEmpty(roomUser)) {
		try {
			const roomUserId = RocketChat.getUidDirectMessage(room);
			const result = await RocketChat.getUserInfo(roomUserId);
			if (result.success) {
				const { user } = result;
				const { roles } = user;
				if (roles && roles.length) {
					user.parsedRoles = await Promise.all(roles.map(async(role) => {
						const description = await getRoleDescription(role);
						return description;
					}));
				}

				return user;
			}
		} catch {
			// do nothing
		}
	}
};

export default loadUser;

