import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ScrollView } from 'react-native';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import map from 'lodash/map';
import { emojify } from 'react-emojione';
import equal from 'deep-equal';

import TabBar from './TabBar';
import EmojiCategory from './EmojiCategory';
import styles from './styles';
import categories from './categories';
import database, { safeAddListener } from '../../lib/realm';
import { emojisByCategory } from '../../emojis';
import protectedFunction from '../../lib/methods/helpers/protectedFunction';

const scrollProps = {
	keyboardShouldPersistTaps: 'always',
	keyboardDismissMode: 'none'
};

export default class EmojiPicker extends Component {
	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		onEmojiSelected: PropTypes.func,
		tabEmojiStyle: PropTypes.object,
		emojisPerRow: PropTypes.number,
		width: PropTypes.number
	};

	constructor(props) {
		super(props);
		this.frequentlyUsed = database.objects('frequentlyUsedEmoji').sorted('count', true);
		this.customEmojis = database.objects('customEmojis');
		this.state = {
			frequentlyUsed: [],
			customEmojis: [],
			show: false
		};
		this.updateFrequentlyUsed = this.updateFrequentlyUsed.bind(this);
		this.updateCustomEmojis = this.updateCustomEmojis.bind(this);
	}

	componentDidMount() {
		this.updateFrequentlyUsed();
		this.updateCustomEmojis();
		requestAnimationFrame(() => this.setState({ show: true }));
		safeAddListener(this.frequentlyUsed, this.updateFrequentlyUsed);
		safeAddListener(this.customEmojis, this.updateCustomEmojis);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { frequentlyUsed, customEmojis, show } = this.state;
		const { width } = this.props;
		if (nextState.show !== show) {
			return true;
		}
		if (nextProps.width !== width) {
			return true;
		}
		if (!equal(nextState.frequentlyUsed, frequentlyUsed)) {
			return true;
		}
		if (!equal(nextState.customEmojis, customEmojis)) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		this.frequentlyUsed.removeAllListeners();
		this.customEmojis.removeAllListeners();
	}

	onEmojiSelected(emoji) {
		const { onEmojiSelected } = this.props;
		if (emoji.isCustom) {
			const count = this._getFrequentlyUsedCount(emoji.content);
			this._addFrequentlyUsed({
				content: emoji.content, extension: emoji.extension, count, isCustom: true
			});
			onEmojiSelected(`:${ emoji.content }:`);
		} else {
			const content = emoji;
			const count = this._getFrequentlyUsedCount(content);
			this._addFrequentlyUsed({ content, count, isCustom: false });
			const shortname = `:${ emoji }:`;
			onEmojiSelected(emojify(shortname, { output: 'unicode' }), shortname);
		}
	}

	// eslint-disable-next-line react/sort-comp
	_addFrequentlyUsed = protectedFunction((emoji) => {
		database.write(() => {
			database.create('frequentlyUsedEmoji', emoji, true);
		});
	})

	_getFrequentlyUsedCount = (content) => {
		const emojiRow = this.frequentlyUsed.filtered('content == $0', content);
		return emojiRow.length ? emojiRow[0].count + 1 : 1;
	}

	updateFrequentlyUsed() {
		const frequentlyUsed = map(this.frequentlyUsed.slice(), (item) => {
			if (item.isCustom) {
				return item;
			}
			return emojify(`${ item.content }`, { output: 'unicode' });
		});
		this.setState({ frequentlyUsed });
	}

	updateCustomEmojis() {
		const customEmojis = map(this.customEmojis.slice(), item => ({ content: item.name, extension: item.extension, isCustom: true }));
		this.setState({ customEmojis });
	}

	renderCategory(category, i) {
		const { frequentlyUsed, customEmojis } = this.state;
		const { emojisPerRow, width, baseUrl } = this.props;

		let emojis = [];
		if (i === 0) {
			emojis = frequentlyUsed;
		} else if (i === 1) {
			emojis = customEmojis;
		} else {
			emojis = emojisByCategory[category];
		}
		return (
			<EmojiCategory
				emojis={emojis}
				onEmojiSelected={emoji => this.onEmojiSelected(emoji)}
				style={styles.categoryContainer}
				size={emojisPerRow}
				width={width}
				baseUrl={baseUrl}
			/>
		);
	}

	render() {
		const { show } = this.state;
		const { tabEmojiStyle } = this.props;

		if (!show) {
			return null;
		}
		return (
			<ScrollableTabView
				renderTabBar={() => <TabBar tabEmojiStyle={tabEmojiStyle} />}
				contentProps={scrollProps}
				style={styles.background}
			>
				{
					categories.tabs.map((tab, i) => (
						<ScrollView
							key={tab.category}
							tabLabel={tab.tabLabel}
							style={styles.background}
							{...scrollProps}
						>
							{this.renderCategory(tab.category, i)}
						</ScrollView>
					))
				}
			</ScrollableTabView>
		);
	}
}
