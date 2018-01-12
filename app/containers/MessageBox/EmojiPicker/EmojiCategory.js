import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, TouchableOpacity, Image } from 'react-native';
import styles from './styles';

export default class extends React.PureComponent {
	static propTypes = {
		emojis: PropTypes.any,
		finishedLoading: PropTypes.func,
		onEmojiSelected: PropTypes.func
	};

	componentDidMount() {
		this.props.finishedLoading();
	}

	renderEmoji = (emoji) => {
		if (emoji.isCustom) {
			return (
				<Image
					style={styles.customCategoryEmoji}
					source={{ uri: `https://open.rocket.chat/emoji-custom/${ encodeURIComponent(emoji.content) }.${ emoji.extension }` }}
				/>
			);
		}
		return (
			<Text style={styles.categoryEmoji}>
				{emoji}
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
