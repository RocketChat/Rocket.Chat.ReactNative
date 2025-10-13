import React from 'react';
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

const BigEmoji = ({ value }: IBigEmojiProps) => (
	<View style={styles.container}>
		{value.map(block => (
			<Emoji block={block} isBigEmoji />
		))}
	</View>
);

export default BigEmoji;
