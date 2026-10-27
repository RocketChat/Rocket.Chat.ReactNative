import { useEffect, useState } from 'react';

import { type IMessage, type SubscriptionType } from '~/definitions';
import { messagesViewContent, type TMessagesViewScreen } from '../messagesViewContent';

interface IUseMessages {
	rid: string;
	t: SubscriptionType;
	userId: string;
	screenName: TMessagesViewScreen;
}

const withUrlPreviews = (message: IMessage): IMessage => ({
	...message,
	urls: message.urls?.map((url, index) => ({
		...url,
		_id: index,
		title: url.meta?.pageTitle,
		description: url.meta?.ogDescription,
		image: url.meta?.ogImage
	}))
});

export const useMessages = ({ rid, t, userId, screenName }: IUseMessages) => {
	const [offset, setOffset] = useState(0);
	const [loading, setLoading] = useState(true);
	const [messages, setMessages] = useState<IMessage[]>([]);
	const [total, setTotal] = useState(-1);

	useEffect(() => {
		let cancelled = false;
		const fetchPage = async () => {
			setLoading(true);
			try {
				const result = await messagesViewContent[screenName].fetch({ rid, t, userId, offset });
				if (!cancelled && result?.success) {
					setMessages(previous => [...previous, ...result.messages.map(withUrlPreviews)]);
					setTotal(result.total);
				}
			} catch (error) {
				console.error(error);
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};
		fetchPage();
		return () => {
			cancelled = true;
		};
	}, [rid, t, userId, screenName, offset]);

	const loadMore = () => {
		if (loading || messages.length === total) return;
		setOffset(messages.length);
	};

	const removeMessage = (messageId: string) => {
		setMessages(previous => previous.filter(message => message._id !== messageId));
		setTotal(previous => previous - 1);
	};

	return { messages, loading, loadMore, removeMessage };
};

export default useMessages;
