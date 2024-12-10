import React from 'react';
import {
	StyleSheet,
	Text,
	TextInputProps,
	TouchableOpacity,
	TouchableOpacityProps,
	View,
	useWindowDimensions
} from 'react-native';

import I18n from '../../../i18n';
import sharedStyles from '../../Styles';
import { useTheme } from '../../../theme';
import SearchHeader from '../../../containers/SearchHeader';
import { useAppSelector } from '../../../lib/hooks';
import { isTablet } from '../../../lib/methods/helpers';

const styles = StyleSheet.create({
	container: {
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
	}
});

interface IRoomHeader {
	connecting: boolean;
	connected: boolean;
	isFetching: boolean;
	serverName: string;
	server: string;
	showSearchHeader: boolean;
	width?: number;
	onSearchChangeText: TextInputProps['onChangeText'];
	onPress: TouchableOpacityProps['onPress'];
}

const Header = React.memo(
	({
		connecting,
		connected,
		isFetching,
		serverName = 'Rocket.Chat',
		server,
		showSearchHeader,
		width,
		onSearchChangeText,
		onPress
	}: IRoomHeader) => {
		const { status: supportedVersionsStatus } = useAppSelector(state => state.supportedVersions);
		const { colors } = useTheme();
		const { width: windowWidth } = useWindowDimensions();

		if (showSearchHeader) {
			return <SearchHeader onSearchChangeText={onSearchChangeText} testID='rooms-list-view-search-input' />;
		}
		let subtitle;
		if (supportedVersionsStatus === 'expired') {
			subtitle = 'Cannot connect';
		} else if (connecting) {
			subtitle = I18n.t('Connecting');
		} else if (isFetching) {
			subtitle = I18n.t('Updating');
		} else if (!connected) {
			subtitle = I18n.t('Waiting_for_network');
		} else {
			subtitle = server?.replace(/(^\w+:|^)\/\//, '');
		}
		// improve copy
		return (
			<View
				style={[styles.container, { width: width || (isTablet ? undefined : windowWidth) }]}
				accessibilityLabel={`${serverName} ${subtitle}`}
				accessibilityRole='header'
				accessible>
				<TouchableOpacity onPress={onPress} testID='rooms-list-header-servers-list-button'>
					<View style={styles.button}>
						<Text style={[styles.title, { color: colors.fontTitlesLabels }]} numberOfLines={1}>
							{serverName}
						</Text>
					</View>
					{subtitle ? (
						<Text
							testID='rooms-list-header-server-subtitle'
							style={[styles.subtitle, { color: colors.fontSecondaryInfo }]}
							numberOfLines={1}>
							{subtitle}
						</Text>
					) : null}
				</TouchableOpacity>
			</View>
		);
	}
);

export default Header;
