import 'string.fromcodepoint';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ScrollView, View } from 'react-native';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import emoji from 'emoji-datasource/emoji.json';
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

const charFromUtf16 = utf16 => String.fromCodePoint(...utf16.split('-').map(u => `0x${ u }`));
const charFromEmojiObj = obj => charFromUtf16(obj.unified);

const filteredEmojis = emoji.filter(e => parseFloat(e.added_in) < 10.0);
const groupedAndSorted = groupBy(orderBy(filteredEmojis, 'sort_order'), 'category');
const emojisByCategory = mapValues(groupedAndSorted, group => group.map(charFromEmojiObj));

export default class extends Component {
	static propTypes = {
		onEmojiSelected: PropTypes.func
	};

	constructor(props) {
		super(props);
		this.state = {
			categories: categories.list.slice(0, 1)
		};
	}

	componentWillUnmount() {
		clearTimeout(this._timeout);
	}

	loadNextCategory() {
		if (this.state.categories.length < categories.list.length) {
			this.setState({ categories: categories.list.slice(0, this.state.categories.length + 1) });
		}
	}

	renderCategory(category) {
		return (
			<View style={{ flex: 1, alignItems: 'center' }}>
				<EmojiCategory
					key={category}
					emojis={emojisByCategory[category]}
					onEmojiSelected={this.props.onEmojiSelected}
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
								{this.renderCategory(tab.category)}
							</ScrollView>
						))
					}
				</ScrollableTabView>
			</View>
		);
	}
}

