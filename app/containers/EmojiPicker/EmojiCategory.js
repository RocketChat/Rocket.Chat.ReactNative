import React from 'react';
import PropTypes from 'prop-types';
import { Text, TouchableOpacity, FlatList } from 'react-native';
import { responsive } from 'react-native-responsive-ui';

import shortnameToUnicode from '../../utils/shortnameToUnicode';
import styles from './styles';
import CustomEmoji from './CustomEmoji';
import scrollPersistTaps from '../../utils/scrollPersistTaps';

const EMOJI_SIZE = 50;

const renderEmoji = (emoji, size, baseUrl) => {
	if (emoji && emoji.isCustom) {
		return <CustomEmoji style={[styles.customCategoryEmoji, { height: size - 16, width: size - 16 }]} emoji={emoji} baseUrl={baseUrl} />;
	}
	return (
		<Text style={[styles.categoryEmoji, { height: size, width: size, fontSize: size - 14 }]}>
			{shortnameToUnicode(`:${ emoji }:`)}
		</Text>
	);
};

class EmojiCategory extends React.Component {
	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		emojis: PropTypes.any,
		window: PropTypes.any,
		onEmojiSelected: PropTypes.func,
		emojisPerRow: PropTypes.number,
		width: PropTypes.number
	}

	renderItem(emoji) {
		const { baseUrl, onEmojiSelected } = this.props;
		return (
			<TouchableOpacity
				activeOpacity={0.7}
				key={emoji && emoji.isCustom ? emoji.content : emoji}
				onPress={() => onEmojiSelected(emoji)}
				testID={`reaction-picker-${ emoji && emoji.isCustom ? emoji.content : emoji }`}
			>
				{renderEmoji(emoji, EMOJI_SIZE, baseUrl)}
			</TouchableOpacity>
		);
	}

	render() {
		const { emojis, width } = this.props;

		if (!width) {
			return null;
		}

		const numColumns = Math.trunc(width / EMOJI_SIZE);
		const marginHorizontal = (width - (numColumns * EMOJI_SIZE)) / 2;

		return (
			<FlatList
				contentContainerStyle={{ marginHorizontal }}
				// rerender FlatList in case of width changes
				key={`emoji-category-${ width }`}
				keyExtractor={item => (item && item.isCustom && item.content) || item}
				data={emojis}
				extraData={this.props}
				renderItem={({ item }) => this.renderItem(item)}
				numColumns={numColumns}
				initialNumToRender={45}
				removeClippedSubviews
				{...scrollPersistTaps}
			/>
		);
	}
}

export default responsive(EmojiCategory);
