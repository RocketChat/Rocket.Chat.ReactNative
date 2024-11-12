import { useState, useEffect } from 'react';

import { IMessage, SubscriptionType } from '../../../definitions';
import fetchMessages from '../methods/fetchMessages';

interface IUseMessage {
	rid: string;
	t: SubscriptionType;
	screenName: string;
	userId: string;
}

export const useMessages = ({ rid, screenName, t, userId }: IUseMessage) => {
	const [loading, setLoading] = useState(false);
	const [messages, setMessages] = useState<IMessage[]>([]);
	const [total, setTotal] = useState(-1);

	const load = async () => {
		if (messages.length === total || loading) return;

		setLoading(true);

		try {
			const result = await fetchMessages({ t, rid, screenName, userId, offset: messages.length });
			if (result?.success) {
				const urlRenderMessages = result?.messages?.map((message: IMessage) => ({
					...message,
					urls: message.urls?.map((url, index) => ({
						_id: index,
						title: url.meta?.pageTitle,
						description: url.meta?.ogDescription,
						image: url.meta?.ogImage,
						url: url.url
					}))
				}));
				setMessages([...messages, ...urlRenderMessages]);
				setTotal(result.total);
			}
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const updateMessageOnActionPress = (message_id: string) => {
		setMessages(prevState => prevState.filter((item: IMessage) => item._id !== message_id));
		setTotal(prevState => prevState - 1);
	};

	useEffect(() => {
		load();
	}, []);

	return { messages, loading, updateMessageOnActionPress, loadMore: load };
};

export default useMessages;
