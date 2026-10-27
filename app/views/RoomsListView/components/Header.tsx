import { memo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Touchable } from 'react-native-gesture-handler';

import { showActionSheetRef } from '~/containers/ActionSheet';
import SearchHeader from '~/containers/SearchHeader';
import I18n from '~/i18n';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import { useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import ServersList from './ServersList';
import { useRoomsListSubtitle } from '../hooks/useRoomsListSubtitle';

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
	const serverName = useAppSelector(state => state.settings.Site_Name as string);
	const supportedVersionsExpired = useAppSelector(state => state.supportedVersions.status === 'expired');
	const connectionSubtitle = useRoomsListSubtitle();
	const subtitle = supportedVersionsExpired ? I18n.t('Cannot_connect') : connectionSubtitle;
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
	return (
		<View style={styles.container}>
			<Touchable
				activeOpacity={0.2}
				animationDuration={{ in: 0, out: 150 }}
				onPress={onPress}
				testID='rooms-list-header-servers-list-button'
				accessibilityLabel={`${serverName} ${subtitle}`}
				accessibilityRole='header'>
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
			</Touchable>
		</View>
	);
};

export default memo(RoomsListHeaderView);
