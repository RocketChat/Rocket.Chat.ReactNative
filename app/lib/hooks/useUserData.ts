import { useEffect, useState } from 'react';

import { getSubscriptionByRoomId } from '../database/services/Subscription';
import { getRoomAvatar, getUidDirectMessage } from '../methods/helpers';
import { SubscriptionType } from '../../definitions';
import { Services } from '../services';
import { useAppSelector } from './useAppSelector';

const useUserData = (rid: string) => {
	const [user, setUser] = useState({ username: '', avatar: '', uid: '', type: '', direct: false });
	const { useRealName } = useAppSelector(state => ({
		useRealName: state.settings.UI_Use_Real_Name as boolean
	}));
	useEffect(() => {
		(async () => {
			const room = await getSubscriptionByRoomId(rid);
			if (room) {
				const uid = (await getUidDirectMessage(room)) as string;
				const avt = getRoomAvatar(room);
				const username = useRealName && room.fname ? room.fname : room.name;
				setUser({
					uid,
					username,
					avatar: avt,
					type: room?.t || '',
					direct: room?.t === SubscriptionType.DIRECT
				});
			} else {
				try {
					const result = await Services.getUserInfo(rid);
					if (result.success) {
						const { user } = result;
						const username = useRealName && user.name ? user.name : user.username;
						setUser({
							username,
							avatar: user.username,
							uid: user._id,
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
