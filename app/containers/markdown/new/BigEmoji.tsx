import React, { FC } from 'react';
import { StyleSheet, View } from 'react-native';
import { BigEmoji as BigEmojiProps } from '@rocket.chat/message-parser';

import Emoji from './Emoji';

interface IBigEmojiProps {
	value: BigEmojiProps['value'];
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row'
	}
});

const BigEmoji: FC<IBigEmojiProps> = ({ value }) => (
	<View style={styles.container}>
		{value.map(block => (
			<Emoji emojiHandle={`:${block.value.value}:`} isBigEmoji />
		))}
	</View>
);

export default BigEmoji;
