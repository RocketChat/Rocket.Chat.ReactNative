import React, { memo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { showActionSheetRef } from '../../../containers/ActionSheet';
import SearchHeader from '../../../containers/SearchHeader';
import I18n from '../../../i18n';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { useTheme } from '../../../theme';
import sharedStyles from '../../Styles';
import ServersList from './ServersList';

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

// search and searchEnabled need to be props because Header is used on react-navigation, which does not support context
const RoomsListHeaderView = ({ search, searchEnabled }: { search: (text: string) => void; searchEnabled: boolean }) => {
	const connecting = useAppSelector(state => state.meteor.connecting || state.server.loading);
	const connected = useAppSelector(state => state.meteor.connected);
	const isFetching = useAppSelector(state => state.rooms.isFetching);
	const serverName = useAppSelector(state => state.settings.Site_Name as string);
	const server = useAppSelector(state => state.server.server);
	const { status: supportedVersionsStatus } = useAppSelector(state => state.supportedVersions);
	const { colors } = useTheme();
	const { fontScale } = useWindowDimensions();

	const onPress = () => {
		showActionSheetRef({ children: <ServersList />, enableContentPanningGesture: false });
	};

	if (searchEnabled) {
		// This value is necessary to keep the alignment in MasterDetail.
		const height = 37 * fontScale;
		return <SearchHeader onSearchChangeText={search} testID='rooms-list-view-search-input' style={{ height }} />;
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
};

export default memo(RoomsListHeaderView);
