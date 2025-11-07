import React from 'react';
import { StyleSheet, View } from 'react-native';
import { type BigEmoji as BigEmojiProps } from '@rocket.chat/message-parser';

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
		{value.map((block, index) => (
			<Emoji key={('shortCode' in block ? block.shortCode : block.unicode) ?? index} block={block} isBigEmoji />
		))}
	</View>
);

export default BigEmoji;
