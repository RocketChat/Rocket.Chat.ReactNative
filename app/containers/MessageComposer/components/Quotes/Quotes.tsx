import { useEffect, useRef, type ReactElement } from 'react';
import { FlatList } from 'react-native';

import { Quote } from './Quote';
import { useQuotedMessageIds } from '../../../message/stores/MessageActionStore';

export const Quotes = (): ReactElement | null => {
	'use memo';

	const selectedMessages = useQuotedMessageIds();
	const nQuotesRef = useRef(0);
	const listRef = useRef<FlatList>(null);

	useEffect(() => {
		if (nQuotesRef.current && nQuotesRef.current < selectedMessages.length) {
			setTimeout(() => {
				listRef.current?.scrollToEnd({ animated: true });
			}, 100);
		}
		nQuotesRef.current = selectedMessages.length;
	}, [selectedMessages.length]);

	if (!selectedMessages.length) {
		return null;
	}

	return (
		<FlatList
			ref={listRef}
			data={selectedMessages}
			renderItem={({ item }) => <Quote messageId={item} />}
			horizontal
			keyExtractor={item => item}
		/>
	);
};
