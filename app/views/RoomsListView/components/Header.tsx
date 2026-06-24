import { memo } from 'react';
import { Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native-unistyles';

import { showActionSheetRef } from '../../../containers/ActionSheet';
import SearchHeader from '../../../containers/SearchHeader';
import I18n from '../../../i18n';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import sharedStyles from '../../Styles';
import ServersList from './ServersList';

const styles = StyleSheet.create((theme, rt) => ({
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
		...sharedStyles.textSemibold,
		color: theme.colors.fontTitlesLabels
	},
	subtitle: {
		fontSize: 14,
		...sharedStyles.textRegular,
		color: theme.colors.fontSecondaryInfo
	},
	searchHeader: {
		height: 37 * rt.fontScale
	}
}));

// search and searchEnabled need to be props because Header is used on react-navigation, which does not support context
const RoomsListHeaderView = ({ search, searchEnabled }: { search: (text: string) => void; searchEnabled: boolean }) => {
	'use memo';

	const connecting = useAppSelector(state => state.meteor.connecting || state.server.loading);
	const connected = useAppSelector(state => state.meteor.connected);
	const isLoggingIn = useAppSelector(state => state.login.isFetching);
	const isFetching = useAppSelector(state => state.rooms.isFetching);
	const serverName = useAppSelector(state => state.settings.Site_Name as string);
	const server = useAppSelector(state => state.server.server);
	const { status: supportedVersionsStatus } = useAppSelector(state => state.supportedVersions);

	const onPress = () => {
		showActionSheetRef({ children: <ServersList />, enableContentPanningGesture: false });
	};

	if (searchEnabled) {
		return <SearchHeader onSearchChangeText={search} testID='rooms-list-view-search-input' style={styles.searchHeader} />;
	}
	let subtitle;
	if (supportedVersionsStatus === 'expired') {
		subtitle = 'Cannot connect';
	} else if (connecting || isLoggingIn) {
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
					<Text style={styles.title} numberOfLines={1}>
						{serverName}
					</Text>
				</View>
				{subtitle ? (
					<Text testID='rooms-list-header-server-subtitle' style={styles.subtitle} numberOfLines={1}>
						{subtitle}
					</Text>
				) : null}
			</TouchableOpacity>
		</View>
	);
};

export default memo(RoomsListHeaderView);
