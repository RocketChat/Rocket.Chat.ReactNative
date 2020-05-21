import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, FlatList, StyleSheet
} from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import shortnameToUnicode from '../../utils/shortnameToUnicode';
import CustomEmoji from '../EmojiPicker/CustomEmoji';

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
	headerList: {
		paddingBottom: 16
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


const HeaderItem = React.memo(({
	item, onPress, server, theme
}) => (
	<RectButton onPress={onPress} style={[styles.headerItem, { backgroundColor: themes[theme].auxiliaryBackground }]}>
		{item?.isCustom ? (
			<CustomEmoji style={styles.customEmoji} emoji={item} baseUrl={server} />
		) : (
			<Text style={styles.headerIcon}>
				{shortnameToUnicode(`:${ item.content || item }:`)}
			</Text>
		)}
	</RectButton>
));
HeaderItem.propTypes = {
	item: PropTypes.string,
	onPress: PropTypes.func,
	server: PropTypes.string,
	theme: PropTypes.string
};

const HeaderFooter = React.memo(({ onAdd, theme }) => (
	<RectButton onPress={onAdd} style={[styles.headerItem, { backgroundColor: themes[theme].auxiliaryBackground }]}>
		<CustomIcon name='add-reaction' size={24} color={themes[theme].bodyText} />
	</RectButton>
));
HeaderFooter.propTypes = {
	onAdd: PropTypes.func,
	theme: PropTypes.string
};

const Header = React.memo(({
	items = ['+1', '+1', '+1', '+1', '+1', '+1'], onAdd, onPress, server, theme
}) => (
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
));
Header.propTypes = {
	items: PropTypes.array,
	onAdd: PropTypes.func,
	onPress: PropTypes.func,
	server: PropTypes.string,
	theme: PropTypes.string
};
export default withTheme(Header);
