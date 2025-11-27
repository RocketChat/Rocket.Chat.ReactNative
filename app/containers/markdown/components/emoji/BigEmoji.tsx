import React from 'react';
import { StyleSheet, View } from 'react-native';
import { type Emoji as EmojiType, type BigEmoji as BigEmojiProps } from '@rocket.chat/message-parser';

import Emoji from './Emoji';

interface IBigEmojiProps {
	value: BigEmojiProps['value'];
}

type TEmojiWithId = EmojiType & { _id: string };

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row'
	}
});

const BigEmoji = ({ value }: IBigEmojiProps) => (
	<View style={styles.container}>
		{value.map(b => {
			const block = b as TEmojiWithId;
			return <Emoji key={block._id} block={block} isBigEmoji />;
		})}
	</View>
);

export default BigEmoji;
