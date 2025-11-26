import React from 'react';
import { StyleSheet, View } from 'react-native';
import { type BigEmoji as BigEmojiProps } from '@rocket.chat/message-parser';

import getBlockValueString from '../../../../lib/methods/getBlockValueString';
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
		{value.map((block, index) => {
			const blockValue = 'shortCode' in block ? block.shortCode : block.unicode;
			const key = `${block.type}-${getBlockValueString(blockValue)}-${index}`;
			return <Emoji key={key} block={block} isBigEmoji />;
		})}
	</View>
);

export default BigEmoji;
