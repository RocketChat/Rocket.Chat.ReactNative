import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ScrollView } from 'react-native';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import _ from 'lodash';
import { emojify } from 'react-emojione';
import TabBar from './TabBar';
import EmojiCategory from './EmojiCategory';
import styles from './styles';
import categories from './categories';
import database from '../../lib/realm';
import { emojisByCategory } from '../../emojis';

const scrollProps = {
	keyboardShouldPersistTaps: 'always',
	keyboardDismissMode: 'none'
};

export default class EmojiPicker extends Component {
	static propTypes = {
		onEmojiSelected: PropTypes.func,
		tabEmojiStyle: PropTypes.object,
		emojisPerRow: PropTypes.number,
		width: PropTypes.number
	};

	constructor(props) {
		super(props);
		this.state = {
			frequentlyUsed: [],
			customEmojis: []
		};
		this.frequentlyUsed = database.objects('frequentlyUsedEmoji').sorted('count', true);
		this.customEmojis = database.objects('customEmojis');
		this.updateFrequentlyUsed = this.updateFrequentlyUsed.bind(this);
		this.updateCustomEmojis = this.updateCustomEmojis.bind(this);
	}
	//
	// shouldComponentUpdate(nextProps) {
	// 	return false;
	// }

	componentDidMount() {
		requestAnimationFrame(() => this.setState({ show: true }));
	}
	componentWillUnmount() {
		this.frequentlyUsed.removeAllListeners();
		this.customEmojis.removeAllListeners();
	}

	onEmojiSelected(emoji) {
		if (emoji.isCustom) {
			const count = this._getFrequentlyUsedCount(emoji.content);
			this._addFrequentlyUsed({
				content: emoji.content, extension: emoji.extension, count, isCustom: true
			});
			this.props.onEmojiSelected(`:${ emoji.content }:`);
		} else {
			const content = emoji;
			const count = this._getFrequentlyUsedCount(content);
			this._addFrequentlyUsed({ content, count, isCustom: false });
			const shortname = `:${ emoji }:`;
			this.props.onEmojiSelected(emojify(shortname, { output: 'unicode' }), shortname);
		}
	}

	UNSAFE_componentWillMount() {
		this.frequentlyUsed.addListener(this.updateFrequentlyUsed);
		this.customEmojis.addListener(this.updateCustomEmojis);
		this.updateFrequentlyUsed();
		this.updateCustomEmojis();
	}

	_addFrequentlyUsed = (emoji) => {
		database.write(() => {
			database.create('frequentlyUsedEmoji', emoji, true);
		});
	}
	_getFrequentlyUsedCount = (content) => {
		const emojiRow = this.frequentlyUsed.filtered('content == $0', content);
		return emojiRow.length ? emojiRow[0].count + 1 : 1;
	}
	updateFrequentlyUsed() {
		const frequentlyUsed = _.map(this.frequentlyUsed.slice(), (item) => {
			if (item.isCustom) {
				return item;
			}
			return emojify(`${ item.content }`, { output: 'unicode' });
		});
		this.setState({ frequentlyUsed });
	}

	updateCustomEmojis() {
		const customEmojis = _.map(this.customEmojis.slice(), item =>
			({ content: item.name, extension: item.extension, isCustom: true }));
		this.setState({ customEmojis });
	}

	renderCategory(category, i) {
		let emojis = [];
		if (i === 0) {
			emojis = this.state.frequentlyUsed;
		} else if (i === 1) {
			emojis = this.state.customEmojis;
		} else {
			emojis = emojisByCategory[category];
		}
		return (
			<EmojiCategory
				emojis={emojis}
				onEmojiSelected={emoji => this.onEmojiSelected(emoji)}
				style={styles.categoryContainer}
				size={this.props.emojisPerRow}
				width={this.props.width}
			/>
		);
	}

	render() {
		if (!this.state.show) {
			return null;
		}
		return (
			// <View style={styles.container}>
			<ScrollableTabView
				renderTabBar={() => <TabBar tabEmojiStyle={this.props.tabEmojiStyle} />}
				contentProps={scrollProps}
			>
				{
					categories.tabs.map((tab, i) => (
						<ScrollView
							key={tab.category}
							tabLabel={tab.tabLabel}
							{...scrollProps}
						>
							{this.renderCategory(tab.category, i)}
						</ScrollView>
					))
				}
			</ScrollableTabView>
			// </View>
		);
	}
}
