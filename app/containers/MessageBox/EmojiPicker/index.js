import 'string.fromcodepoint';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ScrollView, View } from 'react-native';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import emojiDatasource from 'emoji-datasource/emoji.json';
import _ from 'lodash';
import {
	groupBy,
	orderBy
} from 'lodash/collection';
import {
	mapValues
} from 'lodash/object';
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

export default class extends Component {
	static propTypes = {
		onEmojiSelected: PropTypes.func
	};

	constructor(props) {
		super(props);
		this.frequentlyUsed = database.objects('frequentlyUsedEmoji').sorted('count', true);
		this.state = {
			categories: categories.list.slice(0, 1),
			frequentlyUsed: []
		};
		this.updateFrequentlyUsed = this.updateFrequentlyUsed.bind(this);
	}

	componentWillMount() {
		this.frequentlyUsed.addListener(this.updateFrequentlyUsed);
		this.updateFrequentlyUsed();
	}

	componentWillUnmount() {
		clearTimeout(this._timeout);
	}

	onEmojiSelected(emoji) {
		const code_point = emoji.codePointAt(0);
		const emojiRow = this.frequentlyUsed.filtered('code_point == $0', code_point);
		const count = emojiRow.length ? emojiRow[0].count + 1 : 1;
		database.write(() => {
			database.create('frequentlyUsedEmoji', {
				code_point, count
			}, true);
		});
		this.props.onEmojiSelected(emoji);
	}

	updateFrequentlyUsed() {
		const frequentlyUsed = _.map(this.frequentlyUsed.slice(), item => String.fromCodePoint(item.code_point));
		this.setState({ frequentlyUsed });
	}

	loadNextCategory() {
		if (this.state.categories.length < categories.list.length) {
			this.setState({ categories: categories.list.slice(0, this.state.categories.length + 1) });
		}
	}

	renderCategory(category, i) {
		return (
			<View style={styles.categoryContainer}>
				<EmojiCategory
					key={category}
					emojis={i === 0 ? this.state.frequentlyUsed : emojisByCategory[category]}
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
