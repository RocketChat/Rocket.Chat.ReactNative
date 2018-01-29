import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { emojify } from 'react-emojione';
import styles from './styles';
import CustomEmoji from './CustomEmoji';

const { width: windowWidth } = Dimensions.get('window');
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
export default class EmojiCategory extends React.Component {
	static propTypes = {
		emojis: PropTypes.any,
		onEmojiSelected: PropTypes.func,
		emojisPerRow: PropTypes.number,
		width: PropTypes.number
	};
	constructor(props) {
		super(props);
		const { width } = this.props;
		this.size = (width || windowWidth) / (this.props.emojisPerRow || emojisPerRow);
		this.emojis = [];
	}
	componentWillMount() {
		this.emojis = this.props.emojis.slice(0, emojisPerRow * 4).map(item => this.renderItem(item, this.size));
	}
	componentDidMount() {
		requestAnimationFrame(() => {
			this.emojis = this.emojis.concat(this.props.emojis.slice(emojisPerRow * 4).map(item => this.renderItem(item, this.size)));
			requestAnimationFrame(() => {
				this.forceUpdate();
			});
		});
	}
	shouldComponentUpdate() {
		return false;
	}

	renderItem(emoji, size) {
		return (<TouchableOpacity
			activeOpacity={0.7}
			key={emoji.isCustom ? emoji.content : emoji}
			onPress={() => this.props.onEmojiSelected(emoji)}
		>
			{renderEmoji(emoji, size)}
		</TouchableOpacity>);
	}

	render() {
		return (<View style={styles.categoryInner}>{this.emojis}</View>);
	}
}
