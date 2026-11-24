import { useEffect, useState } from 'react';

import { getMessageById } from '~/lib/database/services/Message';
import { getThreadMessageById } from '~/lib/database/services/ThreadMessage';
import { getSubscriptionByRoomId } from '~/lib/database/services/Subscription';
import { getRoomTitle } from '~/lib/methods/helpers/getRoomTitle';
import { getSenderName } from '~/lib/methods/helpers/getSenderName';
import log from '~/lib/methods/helpers/log';
import { type IUserMessage } from '~/definitions/IMessage';

interface INowPlayingAudioSource {
	sender?: IUserMessage;
	roomName?: string;
}

const findAudioMessageSender = async (msgId: string) => {
	const message = (await getMessageById(msgId)) ?? (await getThreadMessageById(msgId));
	return message?.u;
};

const findRoomName = async (rid: string) => {
	const subscription = await getSubscriptionByRoomId(rid);
	return subscription ? getRoomTitle(subscription) : undefined;
};

export const useNowPlayingAudioDetails = (rid: string, msgId: string) => {
	const [source, setSource] = useState<INowPlayingAudioSource>({});

	useEffect(() => {
		let active = true;
		Promise.all([findAudioMessageSender(msgId), findRoomName(rid)])
			.then(([sender, roomName]) => {
				if (active) {
					setSource({ sender, roomName });
				}
			})
			.catch(log);
		return () => {
			active = false;
		};
	}, [rid, msgId]);

	const senderName = source.sender ? getSenderName(source.sender) : undefined;
	return { title: senderName || source.roomName || '', roomName: senderName ? source.roomName : undefined };
};
