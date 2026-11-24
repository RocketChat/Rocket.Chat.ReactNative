import { useEffect, useState } from 'react';

import { getMessageById } from '~/lib/database/services/Message';
import { getThreadMessageById } from '~/lib/database/services/ThreadMessage';
import { getSubscriptionByRoomId } from '~/lib/database/services/Subscription';
import { getRoomTitle } from '~/lib/methods/helpers/getRoomTitle';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { type IUserMessage } from '~/definitions/IMessage';

interface INowPlayingAudioSource {
	sourceKey: string;
	sender?: IUserMessage;
	roomName?: string;
}

const findAudioMessageSender = async (msgId?: string) => {
	if (!msgId) {
		return undefined;
	}
	const message = (await getMessageById(msgId)) ?? (await getThreadMessageById(msgId));
	return message?.u;
};

const findRoomName = async (rid: string) => {
	const subscription = await getSubscriptionByRoomId(rid);
	return subscription ? getRoomTitle(subscription) : undefined;
};

export const useNowPlayingAudioDetails = (rid: string, msgId?: string) => {
	const useRealName = useAppSelector(state => state.settings.UI_Use_Real_Name) as boolean;
	const sourceKey = `${rid}-${msgId}`;
	const [source, setSource] = useState<INowPlayingAudioSource>({ sourceKey: '' });

	useEffect(() => {
		let active = true;
		Promise.all([findAudioMessageSender(msgId), findRoomName(rid)])
			.then(([sender, roomName]) => {
				if (active) {
					setSource({ sourceKey, sender, roomName });
				}
			})
			.catch(() => undefined);
		return () => {
			active = false;
		};
	}, [rid, msgId, sourceKey]);

	const loaded = source.sourceKey === sourceKey;
	const senderName = loaded ? (useRealName && source.sender?.name) || source.sender?.username : undefined;
	const roomName = loaded ? source.roomName : undefined;
	return { title: senderName || roomName || '', roomName: senderName ? roomName : undefined };
};
