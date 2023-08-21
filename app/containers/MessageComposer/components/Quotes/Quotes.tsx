import React from 'react';
import { FlatList } from 'react-native';

import { Quote } from './Quote';
import { useRoomContext } from '../../../../views/RoomView/context';

export const Quotes = () => {
	const { selectedMessages } = useRoomContext();
	return <FlatList data={selectedMessages} renderItem={({ item }) => <Quote messageId={item} />} horizontal />;
};
