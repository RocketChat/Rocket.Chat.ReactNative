import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { emojify } from 'react-emojione';
import styles from './styles';
import CustomEmoji from '../CustomEmoji';

export default class extends React.PureComponent {
	static propTypes = {
		emojis: PropTypes.any,
		onEmojiSelected: PropTypes.func,
		customCategoryEmojiStyle: PropTypes.object,
		categoryEmojiStyle: PropTypes.object
	};

	renderEmoji = (emoji) => {
		if (emoji.isCustom) {
			const style = StyleSheet.flatten(styles.customCategoryEmoji);
			return <CustomEmoji style={[style, this.props.customCategoryEmojiStyle]} emoji={emoji} />;
		}
		return (
			<Text style={[styles.categoryEmoji, this.props.categoryEmojiStyle]}>
				{emojify(`:${ emoji }:`, { output: 'unicode' })}
			</Text>
		);
	}

	render() {
		const { emojis } = this.props;
		return (
			<View>
				<View style={styles.categoryInner}>
					{emojis.map(emoji =>
						(
							<TouchableOpacity
								activeOpacity={0.7}
								key={emoji.isCustom ? emoji.content : emoji}
								onPress={() => this.props.onEmojiSelected(emoji)}
							>
								{this.renderEmoji(emoji)}
							</TouchableOpacity>
						))}
				</View>
			</View>
		);
	}
}
