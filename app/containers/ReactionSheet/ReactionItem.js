import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';

import { themes } from '../../constants/colors';
import Emoji from '../message/Emoji';
import { Button } from '../ActionSheet';
import styles from './styles';

export const ReactionItem = React.memo(({
	item, baseUrl, getCustomEmoji, theme, selected, setSelected
}) => {
	const standardEmojiStyle = { fontSize: 30, color: 'white' };
	const customEmojiStyle = { width: 30, height: 30 };
	const selectedStyle = {
		borderBottomWidth: 2,
		borderBottomColor: themes[theme].bodyText
	};

	return (
		<>
			<Button
				theme={theme}
				onPress={() => setSelected(item)}
			>
				<View
					style={[styles.reactionItem, selected._id === item._id && selectedStyle]}
				>
					<View style={styles.reactionContainer}>
						<Emoji
							content={item.emoji}
							standardEmojiStyle={standardEmojiStyle}
							customEmojiStyle={customEmojiStyle}
							baseUrl={baseUrl}
							getCustomEmoji={getCustomEmoji}
						/>
					</View>
					<Text style={[styles.reactionText, { color: themes[theme].bodyText }]}>{item.usernames.length}</Text>
				</View>
			</Button>
		</>
	);
});

ReactionItem.propTypes = {
	item: PropTypes.string,
	baseUrl: PropTypes.string,
	getCustomEmoji: PropTypes.func,
	theme: PropTypes.string,
	selected: PropTypes.object,
	setSelected: PropTypes.func
};
