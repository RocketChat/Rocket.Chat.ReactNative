import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, TouchableOpacity, Platform } from 'react-native';
import { emojify } from 'react-emojione';
import { responsive } from 'react-native-responsive-ui';
import styles from './styles';
import CustomEmoji from './CustomEmoji';


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


const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

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
		this.emojis = [];
	}
	componentWillMount() {
		this.emojis = this.props.emojis.slice(0, emojisPerRow * 3).map(item => this.renderItem(item, this.size));
	}
	async componentDidMount() {
		const array = this.props.emojis;
		const temparray = [];
		let i;
		let j;
		const chunk = emojisPerRow * 3;
		for (i = chunk, j = array.length; i < j; i += chunk) {
			temparray.push(array.slice(i, i + chunk));
		}
		temparray.forEach(async(items) => {
			await nextFrame();
			this.emojis = this.emojis.concat(items.map(item => this.renderItem(item, this.size)));
			this.forceUpdate();
			await nextFrame();
		});
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
		return <View style={styles.categoryInner}>{this.emojis}</View>;
	}
}
