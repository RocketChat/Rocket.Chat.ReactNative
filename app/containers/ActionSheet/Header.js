import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, FlatList } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import styles from './styles';

const ITEMS = ['😊', '👏🏻', '👍', '😱', '😒', '😊'];

const HeaderItem = React.memo(({ item, theme }) => (
	<RectButton style={[styles.headerItem, { backgroundColor: themes[theme].auxiliaryBackground }]}>
		<Text style={styles.headerIcon}>{item}</Text>
	</RectButton>
));
HeaderItem.propTypes = {
	item: PropTypes.string,
	theme: PropTypes.string
};

const HeaderFooter = React.memo(({ theme }) => (
	<RectButton style={[styles.headerItem, { backgroundColor: themes[theme].auxiliaryBackground }]}>
		<CustomIcon name='add-reaction' size={24} color={themes[theme].bodyText} />
	</RectButton>
));
HeaderFooter.propTypes = {
	theme: PropTypes.string
};

const Header = React.memo(({ theme }) => (
	<>
		<View style={[styles.header, { backgroundColor: themes[theme].backgroundColor }]}>
			<View style={[styles.headerIndicator, { backgroundColor: themes[theme].auxiliaryText }]} />
		</View>
		<FlatList
			data={ITEMS}
			renderItem={({ item }) => <HeaderItem item={item} theme={theme} />}
			style={[styles.headerList, { backgroundColor: themes[theme].backgroundColor }]}
			ListFooterComponent={() => <HeaderFooter theme={theme} />}
			scrollEnabled={false}
			horizontal
		/>
	</>
));
Header.propTypes = {
	theme: PropTypes.string
};
export default Header;
