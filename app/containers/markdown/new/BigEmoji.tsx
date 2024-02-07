import { BigEmoji as BigEmojiProps } from '@rocket.chat/message-parser';
import React from 'react';
import { StyleSheet, View } from 'react-native';

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
		{value.map((block, i) => (
			<Emoji key={block.value?.value ?? i} block={block} isBigEmoji />
		))}
	</View>
);

export default BigEmoji;
