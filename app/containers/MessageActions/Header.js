import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, FlatList, StyleSheet
} from 'react-native';

import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import shortnameToUnicode from '../../utils/shortnameToUnicode';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import database from '../../lib/database';
import { Button } from '../ActionSheet';
import { useDimensions } from '../../dimensions';

export const HEADER_HEIGHT = 36;

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		marginHorizontal: 8
	},
	headerItem: {
		height: 36,
		width: 36,
		borderRadius: 20,
		marginHorizontal: 8,
		justifyContent: 'center',
		alignItems: 'center'
	},
	headerIcon: {
		textAlign: 'center',
		fontSize: 20,
		color: '#fff'
	},
	customEmoji: {
		height: 20,
		width: 20
	}
});

const keyExtractor = item => item?.id || item;

const DEFAULT_EMOJIS = ['clap', '+1', 'heart_eyes', 'grinning', 'thinking_face', 'smiley'];

const HeaderItem = React.memo(({
	item, onReaction, server, theme
}) => (
	<Button
		testID={`message-actions-emoji-${ item.content || item }`}
		onPress={() => onReaction({ emoji: `:${ item.content || item }:` })}
		style={[styles.headerItem, { backgroundColor: themes[theme].auxiliaryBackground }]}
		theme={theme}
	>
		{item?.isCustom ? (
			<CustomEmoji style={styles.customEmoji} emoji={item} baseUrl={server} />
		) : (
			<Text style={styles.headerIcon}>
				{shortnameToUnicode(`:${ item.content || item }:`)}
			</Text>
		)}
	</Button>
));
HeaderItem.propTypes = {
	item: PropTypes.string,
	onReaction: PropTypes.func,
	server: PropTypes.string,
	theme: PropTypes.string
};

const HeaderFooter = React.memo(({ onReaction, theme }) => (
	<Button
		testID='add-reaction'
		onPress={onReaction}
		style={[styles.headerItem, { backgroundColor: themes[theme].auxiliaryBackground }]}
		theme={theme}
	>
		<CustomIcon name='add-reaction' size={24} color={themes[theme].bodyText} />
	</Button>
));
HeaderFooter.propTypes = {
	onReaction: PropTypes.func,
	theme: PropTypes.string
};

const Header = React.memo(({
	handleReaction, server, message, theme
}) => {
	const [items, setItems] = useState([]);
	const { width, height } = useDimensions();

	const setEmojis = async() => {
		try {
			const db = database.active;
			const freqEmojiCollection = db.collections.get('frequently_used_emojis');
			let freqEmojis = await freqEmojiCollection.query().fetch();

			const isLandscape = width > height;
			const size = isLandscape ? width / 2 : width;
			const quantity = (size / 50) - 1;

			freqEmojis = freqEmojis.concat(DEFAULT_EMOJIS).slice(0, quantity);
			setItems(freqEmojis);
		} catch {
			// Do nothing
		}
	};

	useEffect(() => {
		setEmojis();
	}, []);

	const onReaction = ({ emoji }) => handleReaction(emoji, message);

	const renderItem = useCallback(({ item }) => <HeaderItem item={item} onReaction={onReaction} server={server} theme={theme} />);

	const renderFooter = useCallback(() => <HeaderFooter onReaction={onReaction} theme={theme} />);

	return (
		<View style={[styles.container, { backgroundColor: themes[theme].focusedBackground }]}>
			<FlatList
				data={items}
				renderItem={renderItem}
				ListFooterComponent={renderFooter}
				style={{ backgroundColor: themes[theme].focusedBackground }}
				keyExtractor={keyExtractor}
				showsHorizontalScrollIndicator={false}
				scrollEnabled={false}
				horizontal
			/>
		</View>
	);
});
Header.propTypes = {
	handleReaction: PropTypes.func,
	server: PropTypes.string,
	message: PropTypes.object,
	theme: PropTypes.string
};
export default withTheme(Header);
