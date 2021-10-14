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

const BigEmoji = ({ value }: IBigEmojiProps): JSX.Element => (
	<View style={styles.container}>
		{value.map(block => (
			<Emoji value={block.value} isBigEmoji />
		))}
	</View>
);

export default BigEmoji;
