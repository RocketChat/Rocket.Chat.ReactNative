import { useState, useEffect } from 'react';

import { Services } from '../../../lib/services';
import { Encryption } from '../../../lib/encryption';
import { IMessage, SubscriptionType } from '../../../definitions';

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

	const fetchFiles = async () => {
		const result: any = await Services.getFiles(rid, t, messages.length);
		if (result.success) {
			result.messages = await Encryption.decryptFiles(result.files);
			return result;
		}
	};

	const fetchMessages = () => {
		switch (screenName) {
			case 'Files':
				return fetchFiles();
			case 'Mentions':
				return Services.getMessages(rid, t, { 'mentions._id': { $in: [userId] } }, messages.length);
			case 'Starred':
				return Services.getMessages(rid, t, { 'starred._id': { $in: [userId] } }, messages.length);
			case 'Pinned':
				return Services.getMessages(rid, t, { pinned: true }, messages.length);
		}
	};

	const load = async () => {
		if (messages.length === total || loading) return;

		setLoading(true);

		try {
			const result = await fetchMessages();
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
			setLoading(false);
		} catch (error) {
			setLoading(false);
			console.error(error);
		}
	};

	const updateMessageOnActionPress = (message_id: string) => {
		setMessages(prevState => prevState.filter((item: IMessage) => item._id !== message_id));
		setTotal(prevState => prevState - 1);
	};

	useEffect(() => {
		load();
	}, []);

	return { messages, loading, total, updateMessageOnActionPress, loadMore: load };
};

export default useMessages;
