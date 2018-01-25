import 'string.fromcodepoint';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ScrollView, View } from 'react-native';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import emojiDatasource from 'emoji-datasource/emoji.json';
import _ from 'lodash';
import { groupBy, orderBy } from 'lodash/collection';
import { mapValues } from 'lodash/object';
import TabBar from './TabBar';
import EmojiCategory from './EmojiCategory';
import styles from './styles';
import categories from './categories';
import scrollPersistTaps from '../../../utils/scrollPersistTaps';
import database from '../../../lib/realm';

const charFromUtf16 = utf16 => String.fromCodePoint(...utf16.split('-').map(u => `0x${ u }`));
const charFromEmojiObj = obj => charFromUtf16(obj.unified);

const filteredEmojis = emojiDatasource.filter(e => parseFloat(e.added_in) < 10.0);
const groupedAndSorted = groupBy(orderBy(filteredEmojis, 'sort_order'), 'category');
const emojisByCategory = mapValues(groupedAndSorted, group => group.map(charFromEmojiObj));

export default class extends PureComponent {
	static propTypes = {
		onEmojiSelected: PropTypes.func
	};

	constructor(props) {
		super(props);
		this.state = {
			categories: categories.list.slice(0, 1),
			frequentlyUsed: [],
			customEmojis: []
		};
		this.frequentlyUsed = database.objects('frequentlyUsedEmoji').sorted('count', true);
		this.customEmojis = database.objects('customEmojis');
		this.updateFrequentlyUsed = this.updateFrequentlyUsed.bind(this);
		this.updateCustomEmojis = this.updateCustomEmojis.bind(this);
	}

	componentWillMount() {
		this.frequentlyUsed.addListener(this.updateFrequentlyUsed);
		this.customEmojis.addListener(this.updateCustomEmojis);
		this.updateFrequentlyUsed();
		this.updateCustomEmojis();
	}

	componentWillUnmount() {
		clearTimeout(this._timeout);
	}

	onEmojiSelected(emoji) {
		if (emoji.isCustom) {
			const count = this._getFrequentlyUsedCount(emoji.content);
			this._addFrequentlyUsed({
				content: emoji.content, extension: emoji.extension, count, isCustom: true
			});
			this.props.onEmojiSelected(`:${ emoji.content }:`);
		} else {
			const content = emoji.codePointAt(0).toString();
			const count = this._getFrequentlyUsedCount(content);
			this._addFrequentlyUsed({ content, count, isCustom: false });
			this.props.onEmojiSelected(emoji);
		}
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
			return String.fromCodePoint(item.content);
		});
		this.setState({ frequentlyUsed });
	}

	updateCustomEmojis() {
		const customEmojis = _.map(this.customEmojis.slice(), item => ({ content: item.name, extension: item.extension, isCustom: true }));
		this.setState({ customEmojis });
	}

	loadNextCategory() {
		if (this.state.categories.length < categories.list.length) {
			this.setState({ categories: categories.list.slice(0, this.state.categories.length + 1) });
		}
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
			<View style={styles.categoryContainer}>
				<EmojiCategory
					key={category}
					emojis={emojis}
					onEmojiSelected={emoji => this.onEmojiSelected(emoji)}
					finishedLoading={() => { this._timeout = setTimeout(this.loadNextCategory.bind(this), 100); }}
				/>
			</View>
		);
	}

	render() {
		const scrollProps = {
			keyboardShouldPersistTaps: 'always'
		};
		return (
			<View style={styles.container}>
				<ScrollableTabView
					renderTabBar={() => <TabBar />}
					contentProps={scrollProps}
				>
					{
						_.map(categories.tabs, (tab, i) => (
							<ScrollView
								key={i}
								tabLabel={tab.tabLabel}
								{...scrollPersistTaps}
							>
								{this.renderCategory(tab.category, i)}
							</ScrollView>
						))
					}
				</ScrollableTabView>
			</View>
		);
	}
}
