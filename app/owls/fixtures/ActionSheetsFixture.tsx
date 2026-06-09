import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActionSheetProvider, useActionSheet } from '../../containers/ActionSheet';
import Button from '../../containers/Button';
import { colors } from '../../lib/constants/colors';
import DirectoryOptions from '../../views/DirectoryView/Options';
import MediaAutoDownloadListPicker from '../../views/MediaAutoDownloadView/ListPicker';
import ServersList from '../../views/RoomsListView/components/ServersList';
import UserNotificationPreferencesListPicker from '../../views/UserNotificationPreferencesView/ListPicker';

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
		backgroundColor: colors.light.surfaceTint
	},
	content: {
		padding: 24,
		gap: 16
	},
	title: {
		color: colors.light.fontTitlesLabels,
		fontSize: 22,
		fontWeight: '700'
	},
	subtitle: {
		color: colors.light.fontSecondaryInfo,
		fontSize: 15,
		lineHeight: 22
	},
	pickerCard: {
		backgroundColor: colors.light.surfaceRoom,
		borderColor: colors.light.strokeExtraLight,
		borderRadius: 12,
		borderWidth: 1,
		overflow: 'hidden'
	}
});

/**
 * Renders the four action sheets that share the bottom safe-area spacing fix
 * (ServersList, DirectoryView options, and the Media-auto-download &
 * User-notification-preferences list pickers). Each trigger lives on the same
 * screen so a single Owl build can drive every sheet; the test opens them one
 * at a time and screenshots the presented native sheet.
 */
const Triggers = () => {
	const { showActionSheet } = useActionSheet();

	return (
		<ScrollView style={styles.scrollView} contentContainerStyle={styles.content} testID='owl-action-sheets-root'>
			<Text style={styles.title}>Action sheet safe-area fixtures</Text>
			<Text style={styles.subtitle}>
				Each control below opens one of the action sheets affected by the bottom safe-area spacing change.
			</Text>

			<Button
				title='Open servers list'
				testID='owl-trigger-servers-list'
				onPress={() => showActionSheet({ children: <ServersList />, enableContentPanningGesture: false })}
			/>

			<Button
				title='Open directory options'
				testID='owl-trigger-directory-options'
				onPress={() =>
					showActionSheet({
						children: (
							<DirectoryOptions
								type='channels'
								globalUsers={false}
								isFederationEnabled
								changeType={() => {}}
								toggleWorkspace={() => {}}
							/>
						),
						enableContentPanningGesture: false
					})
				}
			/>

			<View style={styles.pickerCard}>
				<MediaAutoDownloadListPicker
					testID='owl-trigger-media-auto-download'
					title='Images'
					value='wifi'
					onChangeValue={() => {}}
				/>
			</View>

			<View style={styles.pickerCard}>
				<UserNotificationPreferencesListPicker
					testID='owl-trigger-user-notification-prefs'
					preference='desktopNotifications'
					value='all'
					title='Desktop'
					onChangeValue={() => {}}
				/>
			</View>
		</ScrollView>
	);
};

const ActionSheetsFixture = () => (
	<ActionSheetProvider>
		<Triggers />
	</ActionSheetProvider>
);

export default ActionSheetsFixture;
