import { useEffect, useState } from 'react';

import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { getRoomAvatar, getUidDirectMessage } from '../methods/helpers';
import { SubscriptionType } from '../../definitions';
import { Services } from '../services';

const useUserData = (rid: string) => {
	const [user, setUser] = useState({ username: '', avatar: '', uid: '', type: '', direct: false });
	useEffect(() => {
		(async () => {
			const room = await getSubscriptionByRoomId(rid);
			if (room) {
				const uid = (await getUidDirectMessage(room)) as string;
				const avt = getRoomAvatar(room);
				setUser({
					uid,
					username: room?.name || '',
					avatar: avt,
					type: room?.t || '',
					direct: room?.t === SubscriptionType.DIRECT
				});
			} else {
				try {
					const result = await Services.getUserInfo(rid);
					if (result.success) {
						setUser({
							username: result.user.name || result.user.username,
							avatar: result.user.username,
							uid: result.user._id,
							type: SubscriptionType.DIRECT,
							direct: true
						});
					}
				} catch (error) {
					//
				}
			}
		})();
	}, []);

	return user;
};

export default useUserData;
