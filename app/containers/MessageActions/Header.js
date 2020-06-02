import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, FlatList, StyleSheet, TouchableOpacity
} from 'react-native';

import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import shortnameToUnicode from '../../utils/shortnameToUnicode';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import database from '../../lib/database';
import { isAndroid } from '../../utils/deviceInfo';
import Touch from '../../utils/touch';

// For some reason react-native-gesture-handler isn't working on bottom sheet (iOS)
const Button = isAndroid ? Touch : TouchableOpacity;

export const HEADER_HEIGHT = 36;

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		marginHorizontal: 8
	},
	headerItem: {
		height: 36,
		width: 36,
		borderRadius: 18,
		marginHorizontal: 8,
		justifyContent: 'center',
		alignItems: 'center'
	},
	headerIcon: {
		fontSize: 20,
		color: '#fff'
	},
	customEmoji: {
		height: 20,
		width: 20
	}
});

const DEFAULT_EMOJIS = ['clap', '+1', 'heart_eyes', 'grinning', 'thinking_face', 'smiley'];

const HeaderItem = React.memo(({
	item, handleReaction, server, theme
}) => (
	<Button
		testID={`message-actions-emoji-${ item.content || item }`}
		onPress={() => handleReaction(`:${ item.content || item }:`)}
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
	handleReaction: PropTypes.func,
	server: PropTypes.string,
	theme: PropTypes.string
};

const HeaderFooter = React.memo(({ handleReaction, theme }) => (
	<Button
		testID='add-reaction'
		onPress={() => handleReaction()}
		style={[styles.headerItem, { backgroundColor: themes[theme].auxiliaryBackground }]}
		theme={theme}
	>
		<CustomIcon name='add-reaction' size={24} color={themes[theme].bodyText} />
	</Button>
));
HeaderFooter.propTypes = {
	handleReaction: PropTypes.func,
	theme: PropTypes.string
};

const Header = React.memo(({
	handleReaction, server, message, theme
}) => {
	const [width, setWidth] = useState(0);
	const [items, setItems] = useState([]);
	useEffect(() => {
		(async() => {
			try {
				const db = database.active;
				const freqEmojiCollection = db.collections.get('frequently_used_emojis');
				let freqEmojis = await freqEmojiCollection.query().fetch();
				freqEmojis = freqEmojis.concat(DEFAULT_EMOJIS);
				setItems(freqEmojis);
			} catch {
				// Do nothing
			}
		})();
	}, []);

	return (
		<View
			onLayout={({ nativeEvent: { layout } }) => setWidth(layout.width)}
			style={[styles.container, { backgroundColor: themes[theme].focusedBackground }]}
		>
			<FlatList
				data={items.slice(0, parseInt((width / 50) - 1, 10))}
				renderItem={({ item }) => <HeaderItem item={item} handleReaction={emoji => handleReaction(emoji, message)} server={server} theme={theme} />}
				style={{ backgroundColor: themes[theme].focusedBackground }}
				ListFooterComponent={() => <HeaderFooter handleReaction={() => handleReaction(null, message)} theme={theme} />}
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
