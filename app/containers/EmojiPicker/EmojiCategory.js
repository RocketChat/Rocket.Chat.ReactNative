import React from 'react';
import PropTypes from 'prop-types';
import { Text, TouchableOpacity, Platform } from 'react-native';
import { emojify } from 'react-emojione';
import { responsive } from 'react-native-responsive-ui';
import { OptimizedFlatList } from 'react-native-optimized-flatlist';
import styles from './styles';
import CustomEmoji from './CustomEmoji';
import scrollPersistTaps from '../../utils/scrollPersistTaps';

const emojisPerRow = Platform.OS === 'ios' ? 8 : 9;

const renderEmoji = (emoji, size) => {
	if (emoji.isCustom) {
		return <CustomEmoji style={[styles.customCategoryEmoji, { height: size - 8, width: size - 8 }]} emoji={emoji} />;
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
		emojis: PropTypes.any,
		window: PropTypes.any,
		onEmojiSelected: PropTypes.func,
		emojisPerRow: PropTypes.number,
		width: PropTypes.number
	};
	constructor(props) {
		super(props);
		const { width, height } = this.props.window;

		this.size = Math.min(this.props.width || width, height) / (this.props.emojisPerRow || emojisPerRow);
		this.emojis = props.emojis;
	}

	shouldComponentUpdate() {
		return false;
	}

	renderItem(emoji, size) {
		return (
			<TouchableOpacity
				activeOpacity={0.7}
				key={emoji.isCustom ? emoji.content : emoji}
				onPress={() => this.props.onEmojiSelected(emoji)}
			>
				{renderEmoji(emoji, size)}
			</TouchableOpacity>);
	}

	render() {
		return (
			<OptimizedFlatList
				keyExtractor={item => (item.isCustom && item.content) || item}
				data={this.props.emojis}
				renderItem={({ item }) => this.renderItem(item, this.size)}
				numColumns={emojisPerRow}
				initialNumToRender={45}
				getItemLayout={(data, index) => ({ length: this.size, offset: this.size * index, index })}
				removeClippedSubviews
				{...scrollPersistTaps}
			/>
		);
	}
}
