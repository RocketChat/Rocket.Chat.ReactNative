import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import styles from './styles';
import CustomEmoji from '../../CustomEmoji';

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
			const style = StyleSheet.flatten(styles.customCategoryEmoji);
			return <CustomEmoji style={style} emoji={emoji} />;
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
