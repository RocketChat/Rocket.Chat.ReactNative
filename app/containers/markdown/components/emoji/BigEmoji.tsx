import React from 'react';
import { View } from 'react-native';
import { type BigEmoji as BigEmojiProps } from '@rocket.chat/message-parser';
import { StyleSheet } from 'react-native-unistyles';

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
