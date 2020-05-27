import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, FlatList, StyleSheet, TouchableOpacity
} from 'react-native';
import { TouchableNativeFeedback } from 'react-native-gesture-handler';

import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import shortnameToUnicode from '../../utils/shortnameToUnicode';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import database from '../../lib/database';
import useDimensions from '../../utils/useDimensions';
import { isAndroid } from '../../utils/deviceInfo';

// For some reason react-native-gesture-handler isn't working on bottom sheet (iOS)
const Button = isAndroid ? TouchableNativeFeedback : TouchableOpacity;

export const HEADER_HEIGHT = 36;

const styles = StyleSheet.create({
	container: {
		alignItems: 'center'
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
	<Button onPress={() => handleReaction(`:${ item.content || item }:`)} style={[styles.headerItem, { backgroundColor: themes[theme].auxiliaryBackground }]}>
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
	<Button onPress={() => handleReaction()} style={[styles.headerItem, { backgroundColor: themes[theme].auxiliaryBackground }]}>
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
	const { width } = useDimensions();
	const [items, setItems] = useState([]);
	useEffect(() => {
		(async() => {
			try {
				const db = database.active;
				const freqEmojiCollection = db.collections.get('frequently_used_emojis');
				let freqEmojis = await freqEmojiCollection.query().fetch();
				freqEmojis = freqEmojis.concat(DEFAULT_EMOJIS);
				freqEmojis = freqEmojis.slice(0, parseInt(((width - 32) / 50) - 1, 10));
				setItems(freqEmojis);
			} catch {
				// Do nothing
			}
		})();
	}, [width]);

	return (
		<View style={[styles.container, { backgroundColor: themes[theme].backgroundColor }]}>
			<FlatList
				data={items}
				renderItem={({ item }) => <HeaderItem item={item} handleReaction={emoji => handleReaction(emoji, message)} server={server} theme={theme} />}
				style={{ backgroundColor: themes[theme].backgroundColor }}
				ListFooterComponent={() => <HeaderFooter handleReaction={() => handleReaction(null, message)} theme={theme} />}
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
