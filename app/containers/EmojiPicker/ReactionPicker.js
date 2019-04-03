import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	ScrollView, View, Text, TouchableOpacity, ActivityIndicator
} from 'react-native';
import map from 'lodash/map';
import { emojify } from 'react-emojione';
import equal from 'deep-equal';

import EmojiCategory from './EmojiCategory';
import styles from './styles';
import categories from './categories';
import database from '../../lib/realm';
import { emojis, emojisByCategory } from '../../emojis';
import protectedFunction from '../../lib/methods/helpers/protectedFunction';
import I18n from '../../i18n';
import RCTextInput from '../TextInput';
import CustomEmoji from './CustomEmoji';

const scrollProps = {
	keyboardShouldPersistTaps: 'always',
	keyboardDismissMode: 'none'
};

const renderEmoji = (emoji, size, baseUrl) => {
	if (emoji.isCustom) {
		return (
			<CustomEmoji
				style={[styles.customCategoryEmoji, { height: size - 8, width: size - 8 }]}
				emoji={emoji}
				baseUrl={baseUrl}
			/>
		);
	}
	return (
		<Text style={[styles.categoryEmoji, { height: size, width: size, fontSize: size - 14 }]}>
			{emojify(`:${ emoji }:`, { output: 'unicode' })}
		</Text>
	);
};

export default class ReactionPicker extends Component {
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
			searchQuery: '',
			searchResults: {}
		};
		this.updateFrequentlyUsed = this.updateFrequentlyUsed.bind(this);
		this.updateCustomEmojis = this.updateCustomEmojis.bind(this);
	}

	componentDidMount() {
		this.updateFrequentlyUsed();
		this.updateCustomEmojis();
		requestAnimationFrame(() => this.setState({ show: true }));
		this.frequentlyUsed.addListener(this.updateFrequentlyUsed);
		this.customEmojis.addListener(this.updateCustomEmojis);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {
			frequentlyUsed, customEmojis, show, searchResults
		} = this.state;
		const { width } = this.props;
		if (nextState.show !== show) {
			return true;
		}
		if (nextProps.width !== width) {
			return true;
		}
		if (nextState.searchResults.length !== searchResults.length) {
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
				content: emoji.content,
				extension: emoji.extension,
				count,
				isCustom: true
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
	});

	_getFrequentlyUsedCount = (content) => {
		const emojiRow = this.frequentlyUsed.filtered('content == $0', content);
		return emojiRow.length ? emojiRow[0].count + 1 : 1;
	};

	handleOnChangeSearchQuery = (newSearchQuery = '') => {
		const { searchQuery } = this.state;

		if (!newSearchQuery) {
			return this.setState({ searchResults: {}, searchQuery: '' });
		}

		if (searchQuery !== newSearchQuery) {
			const searchResults = emojis.filter(
				emojiName => emojiName.indexOf(newSearchQuery.toLowerCase()) === 0
			);

			this.setState({ searchQuery: newSearchQuery, searchResults });
		}
	};

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
		const customEmojis = map(this.customEmojis.slice(), item => ({
			content: item.name,
			extension: item.extension,
			isCustom: true
		}));
		this.setState({ customEmojis });
	}

	renderCategory(category, i) {
		const { frequentlyUsed, customEmojis } = this.state;
		const { emojisPerRow, width, baseUrl } = this.props;
		let emojiCategory;

		if (i === 0) {
			emojiCategory = frequentlyUsed;
		} else if (i === 1) {
			emojiCategory = customEmojis;
		} else {
			emojiCategory = emojisByCategory[category];
		}
		return (
			<EmojiCategory
				emojis={emojiCategory}
				onEmojiSelected={emoji => this.onEmojiSelected(emoji)}
				style={styles.categoryContainer}
				size={emojisPerRow}
				width={width}
				baseUrl={baseUrl}
			/>
		);
	}

	renderItem(emoji, size) {
		const { baseUrl, onEmojiSelected } = this.props;
		return (
			<TouchableOpacity
				activeOpacity={0.7}
				key={emoji.isCustom ? emoji.content : emoji}
				onPress={() => onEmojiSelected(emoji)}
				testID={`reaction-picker-${ emoji.isCustom ? emoji.content : emoji }`}
			>
				{renderEmoji(emoji, size, baseUrl)}
			</TouchableOpacity>
		);
	}

	renderCategories() {
		const { show, searchQuery, searchResults } = this.state;
		const { emojisPerRow, width, baseUrl } = this.props;

		if (!show) {
			return <ActivityIndicator style={styles.loader} />;
		}

		return (
			<ScrollView {...scrollProps} style={styles.background}>
				{(searchQuery
					&& (searchResults.length > 0 ? (
						<View style={styles.background} {...scrollProps}>
							<EmojiCategory
								emojis={searchResults}
								onEmojiSelected={emoji => this.onEmojiSelected(emoji)}
								style={styles.categoryContainer}
								size={emojisPerRow}
								width={width}
								baseUrl={baseUrl}
							/>
						</View>
					) : (
						<Text style={styles.noEmojiFoundText}>{I18n.t('Emoji_Not_Found')}</Text>
					)))
					|| categories.tabs.map((tab, i) => (
						<View key={tab.category} style={styles.background} {...scrollProps}>
							<Text style={styles.categoryTitle}>{tab.title}</Text>
							{this.renderCategory(tab.category, i)}
						</View>
					))}
			</ScrollView>
		);
	}

	render() {
		return (
			<View>
				<RCTextInput
					onChangeText={this.handleOnChangeSearchQuery}
					placeholder={I18n.t('Search_Emoji')}
					testID='search-message-view-input'
				/>
				{this.renderCategories()}
			</View>
		);
	}
}
