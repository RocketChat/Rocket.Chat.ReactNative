import React from 'react';
import { FlatList } from 'react-native';

import { Quote } from './Quote';
import { useRoom } from '../../../../contexts/RoomContext';

export const Quotes = (): React.ReactElement | null => {
	const { selectedMessages, action } = useRoom();

	if (action !== 'quote') {
		return null;
	}
	return <FlatList data={selectedMessages} renderItem={({ item }) => <Quote messageId={item} />} horizontal />;
};