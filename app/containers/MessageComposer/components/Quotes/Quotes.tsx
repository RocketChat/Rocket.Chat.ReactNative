import React, { useEffect, useRef } from 'react';
import { FlatList } from 'react-native';

import { Quote } from './Quote';
import { useRoomContext } from '../../../../views/RoomView/context';

export const Quotes = (): React.ReactElement | null => {
	const { selectedMessages, action } = useRoomContext();
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

	if (action !== 'quote') {
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
