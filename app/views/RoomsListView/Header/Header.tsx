import React from 'react';
import { StyleSheet, Text, TextInputProps, View, useWindowDimensions } from 'react-native';

import I18n from '../../../i18n';
import sharedStyles from '../../Styles';
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
	}
});

interface IRoomHeader {
	connecting: boolean;
	connected: boolean;
	isFetching: boolean;
	serverName: string;
	server: string;
	showSearchHeader: boolean;
	onSearchChangeText: TextInputProps['onChangeText'];
}

const Header = React.memo(
	({
		connecting,
		connected,
		isFetching,
		serverName = 'Rocket.Chat',
		server,
		showSearchHeader,
		onSearchChangeText
	}: IRoomHeader) => {
		const { status: supportedVersionsStatus } = useAppSelector(state => state.supportedVersions);
		const { colors } = useTheme();
		const { fontScale } = useWindowDimensions();

		if (showSearchHeader) {
			// This value is necessary to keep the alignment in MasterDetail.
			const height = 37 * fontScale;
			return <SearchHeader onSearchChangeText={onSearchChangeText} testID='rooms-list-view-search-input' style={{ height }} />;
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
		return (
			<View style={styles.container} accessibilityLabel={`${serverName} ${subtitle}`} accessibilityRole='header' accessible>
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
			</View>
		);
	}
);

export default Header;
