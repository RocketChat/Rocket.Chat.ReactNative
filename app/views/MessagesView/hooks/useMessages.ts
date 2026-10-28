import { useEffect, useEffectEvent, useState } from 'react';

import { type IMessage, type IMessageFromServer, type SubscriptionType } from '~/definitions';
import log from '~/lib/methods/helpers/log';
import parseUrls from '~/lib/methods/helpers/parseUrls';
import { type IMessagesPage, messagesViewContent, type TMessagesViewScreen } from '../messagesViewContent';

interface IUseMessages {
	rid: string;
	t: SubscriptionType;
	userId: string;
	screenName: TMessagesViewScreen;
}

const withParsedUrls = (message: IMessageFromServer) =>
	({
		...message,
		urls: message.urls && parseUrls(message.urls)
	}) as IMessage;

const useMessages = ({ rid, t, userId, screenName }: IUseMessages) => {
	const [loading, setLoading] = useState(true);
	const [messages, setMessages] = useState<IMessage[]>([]);
	const [total, setTotal] = useState(-1);

	const appendPage = (page: IMessagesPage) => {
		if (!page.success) return;
		setMessages(previous => [...previous, ...page.messages.map(withParsedUrls)]);
		setTotal(page.total);
	};

	const fetchPage = (offset: number) =>
		messagesViewContent[screenName]
			.fetch({ rid, t, userId, offset })
			.then(appendPage)
			.catch(log)
			.then(() => setLoading(false));

	const fetchFirstPage = useEffectEvent(() => fetchPage(0));

	useEffect(() => {
		fetchFirstPage();
	}, []);

	const loadMore = () => {
		if (loading || messages.length === total) return;
		setLoading(true);
		fetchPage(messages.length);
	};

	const removeMessage = (messageId: string) => {
		setMessages(previous => previous.filter(message => message._id !== messageId));
		setTotal(previous => previous - 1);
	};

	return { messages, loading, loadMore, removeMessage };
};

export default useMessages;
