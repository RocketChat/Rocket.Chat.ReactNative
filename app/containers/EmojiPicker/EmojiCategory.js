import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { emojify } from 'react-emojione';
import styles from './styles';
import CustomEmoji from '../CustomEmoji';

export default class extends React.PureComponent {
	static propTypes = {
		emojis: PropTypes.any,
		onEmojiSelected: PropTypes.func
	};

	constructor(props) {
		super(props);
		this.state = { width: null };
	}

	setWidth(width) {
		this.setState({ width });
	}

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
		const { emojis } = this.props;
		const { width } = this.state;
		const size = width / (Platform.OS === 'ios' ? 8 : 9);
		return (
			<View
				style={styles.categoryInner}
				onLayout={(event) => {
					this.setWidth(event.nativeEvent.layout.width);
				}}
			>
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
