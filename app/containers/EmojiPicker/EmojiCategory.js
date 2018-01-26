import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { emojify } from 'react-emojione';
import styles from './styles';
import CustomEmoji from './CustomEmoji';

const { width: windowWidth } = Dimensions.get('window');

export default class extends React.PureComponent {
	static propTypes = {
		emojis: PropTypes.any,
		onEmojiSelected: PropTypes.func,
		emojisPerRow: PropTypes.number,
		width: PropTypes.number
	};

	renderEmoji = (emoji, size) => {
		if (emoji.isCustom) {
			let style = StyleSheet.flatten(styles.customCategoryEmoji);
			style = { ...style, height: size - 8, width: size - 8 };
			return <CustomEmoji style={style} emoji={emoji} />;
		}
		return (
			<Text style={[styles.categoryEmoji, { height: size, width: size, fontSize: size - 14 }]}>
				{emojify(`:${ emoji }:`, { output: 'unicode' })}
			</Text>
		);
	}

	render() {
		const { emojis, width } = this.props;
		const size = (width || windowWidth) / (this.props.emojisPerRow || (Platform.OS === 'ios' ? 8 : 9));
		return (
			<View style={styles.categoryInner}>
				{emojis.map(emoji =>
					(
						<TouchableOpacity
							activeOpacity={0.7}
							key={emoji.isCustom ? emoji.content : emoji}
							onPress={() => this.props.onEmojiSelected(emoji)}
						>
							{this.renderEmoji(emoji, size)}
						</TouchableOpacity>
					))}
			</View>
		);
	}
}
