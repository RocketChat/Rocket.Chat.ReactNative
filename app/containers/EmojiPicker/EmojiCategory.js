import React from 'react';
import PropTypes from 'prop-types';
import { Text, TouchableOpacity, FlatList } from 'react-native';
import { emojify } from 'react-emojione';
import { responsive } from 'react-native-responsive-ui';

import styles from './styles';
import CustomEmoji from './CustomEmoji';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { isIOS } from '../../utils/deviceInfo';

const EMOJIS_PER_ROW = isIOS ? 8 : 9;

const renderEmoji = (emoji, size, baseUrl) => {
	if (emoji.isCustom) {
		return (
			<CustomEmoji
				style={[styles.customCategoryEmoji, { height: size - 8, width: size - 8 }]}
				emoji={emoji}
				baseUrl={baseUrl}
			/>
		);
	}

	return (
		<Text style={[styles.categoryEmoji, { height: size, width: size, fontSize: size - 14 }]}>
			{emojify(`:${ emoji }:`, { output: 'unicode' })}
		</Text>
	);
};

@responsive
export default class EmojiCategory extends React.Component {
	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		emojis: PropTypes.any,
		window: PropTypes.any,
		onEmojiSelected: PropTypes.func,
		emojisPerRow: PropTypes.number,
		width: PropTypes.number
	};

	constructor(props) {
		super(props);
		const { window, width, emojisPerRow } = this.props;
		const { width: widthWidth, height: windowHeight } = window;

		this.size = Math.min(width || widthWidth, windowHeight) / (emojisPerRow || EMOJIS_PER_ROW);
		this.emojis = props.emojis;
	}

	shouldComponentUpdate(nextProps) {
		const { emojis: oldEmojis } = this.props;

		if (nextProps.emojis.length !== oldEmojis.length) {
			return true;
		}

		return false;
	}

	renderItem(emoji, size) {
		const { baseUrl, onEmojiSelected } = this.props;
		return (
			<TouchableOpacity
				activeOpacity={0.7}
				key={emoji.isCustom ? emoji.content : emoji}
				onPress={() => onEmojiSelected(emoji)}
				testID={`reaction-picker-${ emoji.isCustom ? emoji.content : emoji }`}
			>
				{renderEmoji(emoji, size, baseUrl)}
			</TouchableOpacity>
		);
	}

	render() {
		const { emojis } = this.props;

		return (
			<FlatList
				keyExtractor={item => (item.isCustom && item.content) || item}
				data={emojis}
				renderItem={({ item }) => this.renderItem(item, this.size)}
				numColumns={EMOJIS_PER_ROW}
				initialNumToRender={30}
				getItemLayout={(data, index) => ({
					length: this.size,
					offset: this.size * index,
					index
				})}
				removeClippedSubviews
				{...scrollPersistTaps}
			/>
		);
	}
}
