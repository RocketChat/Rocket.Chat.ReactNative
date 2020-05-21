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

const styles = StyleSheet.create({
	container: {
		paddingTop: 24,
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
	item, onPress, server, theme
}) => (
	<TouchableOpacity onPress={() => onPress(`:${ item.content || item }:`)} style={[styles.headerItem, { backgroundColor: themes[theme].auxiliaryBackground }]}>
		{item?.isCustom ? (
			<CustomEmoji style={styles.customEmoji} emoji={item} baseUrl={server} />
		) : (
			<Text style={styles.headerIcon}>
				{shortnameToUnicode(`:${ item.content || item }:`)}
			</Text>
		)}
	</TouchableOpacity>
));
HeaderItem.propTypes = {
	item: PropTypes.string,
	onPress: PropTypes.func,
	server: PropTypes.string,
	theme: PropTypes.string
};

const HeaderFooter = React.memo(({ onAdd, theme }) => (
	<TouchableOpacity onPress={onAdd} style={[styles.headerItem, { backgroundColor: themes[theme].auxiliaryBackground }]}>
		<CustomIcon name='add-reaction' size={24} color={themes[theme].bodyText} />
	</TouchableOpacity>
));
HeaderFooter.propTypes = {
	onAdd: PropTypes.func,
	theme: PropTypes.string
};

const Header = React.memo(({
	onAdd, onPress, server, theme
}) => {
	const [items, setItems] = useState([]);
	useEffect(() => {
		(async() => {
			try {
				const db = database.active;
				const freqEmojiCollection = db.collections.get('frequently_used_emojis');
				let freqEmojis = await freqEmojiCollection.query().fetch();
				freqEmojis = freqEmojis.concat(DEFAULT_EMOJIS);
				freqEmojis = freqEmojis.slice(0, 6);
				setItems(freqEmojis);
			} catch {
				// Do nothing
			}
		})();
	}, []);

	return (
		<View style={styles.container}>
			<FlatList
				data={items}
				renderItem={({ item }) => <HeaderItem item={item} onPress={onPress} server={server} theme={theme} />}
				style={[styles.headerList, { backgroundColor: themes[theme].backgroundColor }]}
				ListFooterComponent={() => <HeaderFooter onAdd={onAdd} theme={theme} />}
				scrollEnabled={false}
				horizontal
			/>
		</View>
	);
});
Header.propTypes = {
	onAdd: PropTypes.func,
	onPress: PropTypes.func,
	server: PropTypes.string,
	theme: PropTypes.string
};
export default withTheme(Header);
