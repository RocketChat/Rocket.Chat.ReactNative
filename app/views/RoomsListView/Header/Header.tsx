import React from 'react';
import { StyleSheet, Text, TextInputProps, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

import I18n from '../../../i18n';
import sharedStyles from '../../Styles';
import { CustomIcon } from '../../../containers/CustomIcon';
import { useTheme } from '../../../theme';
import SearchHeader from '../../../containers/SearchHeader';
import { useAppSelector } from '../../../lib/hooks';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center'
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	title: {
		flexShrink: 1,
		fontSize: 16,
		...sharedStyles.textSemibold
	},
	subtitle: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	upsideDown: {
		transform: [{ scaleY: -1 }]
	}
});

interface IRoomHeader {
	connecting: boolean;
	connected: boolean;
	isFetching: boolean;
	serverName: string;
	server: string;
	showServerDropdown: boolean;
	showSearchHeader: boolean;
	onSearchChangeText: TextInputProps['onChangeText'];
	onPress: TouchableOpacityProps['onPress'];
}

const Header = React.memo(({ serverName, showSearchHeader, onSearchChangeText, onPress }: IRoomHeader) => {
	const { colors } = useTheme();

	if (showSearchHeader) {
		return <SearchHeader onSearchChangeText={onSearchChangeText} testID='rooms-list-view-search-input' />;
	}

	return (
		<View style={styles.container}>
			<Text style={[styles.title, { color: colors.headerTitleColor }]} numberOfLines={1}>
				{serverName}
			</Text>
		</View>
	);
});

export default Header;
