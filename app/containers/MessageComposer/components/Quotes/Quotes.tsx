import React from 'react';
import { FlatList } from 'react-native';

import { Quote } from './Quote';
import { useRoomContext } from '../../../../views/RoomView/context';

export const Quotes = (): React.ReactElement | null => {
	const { selectedMessages, action } = useRoomContext();

	if (action !== 'quote') {
		return null;
	}
	return <FlatList data={selectedMessages} renderItem={({ item }) => <Quote messageId={item} />} horizontal />;
};
