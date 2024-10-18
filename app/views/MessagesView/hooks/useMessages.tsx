import { useLayoutEffect, useState } from 'react';

import { IMessage, IUrl } from '../../../definitions';
import AudioManager from '../../../lib/methods/AudioManager';

type TUseMessages = {
	setHeader: () => void;
	fetchFunc: () => Promise<any> | any;
};
const useMessages = ({ setHeader, fetchFunc }: TUseMessages) => {
	const [loading, setLoading] = useState(false);
	const [messages, setMessages] = useState<IMessage[]>([]);
	const [total, setTotal] = useState<number>(-1);

	const load = async () => {
		if (messages.length === total || loading) {
			return;
		}

		setLoading(true);

		try {
			const result = await fetchFunc();
			if (result.success) {
				const urlRenderMessages = result.messages?.map((message: any) => {
					if (message.urls && message.urls.length > 0) {
						message.urls = message.urls?.map((url: any, index: any) => {
							if (url.meta) {
								return {
									_id: index,
									title: url.meta.pageTitle,
									description: url.meta.ogDescription,
									image: url.meta.ogImage,
									url: url.url
								} as IUrl;
							}
							return {} as IUrl;
						});
					}
					return { ...message };
				});
				setMessages([...messages, ...urlRenderMessages]);
				setTotal(result.total);
				setLoading(false);
			}
		} catch (error) {
			setLoading(false);
			console.error(error);
		}
	};

	const updateMessagesOnActionPress = (message_id: string) => {
		setMessages(prevState => prevState.filter((item: IMessage) => item._id !== message_id));
		setTotal(prevState => prevState - 1);
	};

	useLayoutEffect(() => {
		setHeader();
		load();

		return () => {
			AudioManager.pauseAudio();
		};
	}, []);

	return {
		loading,
		messages,
		total,
		loadMore: load,
		updateMessagesOnActionPress
	};
};

export default useMessages;
