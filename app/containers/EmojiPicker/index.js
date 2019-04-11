import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ScrollView } from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import map from 'lodash/map';
import { emojify } from 'react-emojione';
import equal from 'deep-equal';

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

let FREQUENTLY_USED;
let CUSTOM;
let PEOPLE;
let NATURE;
let FOOD;
let ACTIVITY;
let TRAVEL;
let OBJECTS;
let SYMBOLS;
let FLAGS;


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
			show: false,
			tabView: {
				index: 0,
				routes: categories.tabs ,
			}
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
		this.initializeScenes();
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
	
	handleIndexChange = (index) => {
		this.setState({
			tabView:{
				...this.state.tabView, 
				index
			}
		});
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

	initializeScenes() {
		const { frequentlyUsed, customEmojis } = this.state;
		const { list } = categories;
		FREQUENTLY_USED = this.renderCategory(frequentlyUsed);
		CUSTOM = this.renderCategory(customEmojis);
		PEOPLE = this.renderCategory(emojisByCategory[list[2]]);
		NATURE = this.renderCategory(emojisByCategory[list[3]]);
		FOOD = this.renderCategory(emojisByCategory[list[4]]);
		ACTIVITY = this.renderCategory(emojisByCategory[list[5]]);
		TRAVEL = this.renderCategory(emojisByCategory[list[6]]);
		OBJECTS = this.renderCategory(emojisByCategory[list[7]]);
		SYMBOLS = this.renderCategory(emojisByCategory[list[8]]);
		FLAGS = this.renderCategory(emojisByCategory[list[9]]);
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

	renderCategory(emojis) {
		const { emojisPerRow, width, baseUrl } = this.props;
		return (
			<ScrollView
				style={styles.background}
				{...scrollProps}
			>
				<EmojiCategory
					emojis={emojis}
					onEmojiSelected={emoji => this.onEmojiSelected(emoji)}
					style={styles.categoryContainer}
					size={emojisPerRow}
					width={width}
					baseUrl={baseUrl}
				/>
			</ScrollView>
		);
	}

	renderTabBar=(props)=> {
		const { tabEmojiStyle } = this.props;
		return (
			<TabBar
				{...props}
				indicatorStyle={{ backgroundColor: 'blue' }}
				getLabelText={({ route }) => route.icon}
				style={tabEmojiStyle}
			/>
		);
	}

	render() {
		const { show } = this.state;

		if (!show) {
			return null;
		}
		return (
			<TabView
				navigationState={this.state.tabView}
				renderScene={({ route }) => {
					switch (route.key) {
						case 'frequentlyUsed': return FREQUENTLY_USED;
						case 'custom': return CUSTOM;
						case 'people': return PEOPLE;
						case 'nature': return NATURE;
						case 'food': return FOOD;
						case 'activity': return ACTIVITY;
						case 'travel': return TRAVEL;
						case 'objects': return OBJECTS;
						case 'symbols': return SYMBOLS;
						case 'flags': return FLAGS;
						default: return null;
					}
				}}
				renderTabBar={this.renderTabBar}
				onIndexChange={this.handleIndexChange}
			/>
		);
	}
}
