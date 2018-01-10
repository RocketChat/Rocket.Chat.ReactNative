import React from 'react';
import PropTypes from 'prop-types';
import {
	Text,
	View,
	TouchableOpacity
} from 'react-native';
import styles from './styles';

export default class extends React.PureComponent {
	static propTypes = {
		emojis: PropTypes.array,
		finishedLoading: PropTypes.func,
		onEmojiSelected: PropTypes.func
	};

	componentDidMount() {
		this.props.finishedLoading();
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
								key={emoji}
								onPress={() => this.props.onEmojiSelected(emoji)}
							>
								<Text style={styles.categoryEmoji}>
									{emoji}
								</Text>
							</TouchableOpacity>
						))}
				</View>
			</View>
		);
	}
}
