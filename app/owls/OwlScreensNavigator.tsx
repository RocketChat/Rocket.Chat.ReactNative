import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as ScreenOrientation from 'expo-screen-orientation';

import { colors } from '../lib/constants/colors';
import DirectoryView from '../views/DirectoryView';
import MediaAutoDownloadView from '../views/MediaAutoDownloadView';
import RoomsListView from '../views/RoomsListView';
import UserNotificationPreferencesView from '../views/UserNotificationPreferencesView';

const Stack = createNativeStackNavigator();

// Thin launcher used only to navigate to a real screen. It is never captured in
// a baseline — the test always navigates away before taking a screenshot, so
// every baseline is a real application screen with its real action sheet.
const LINKS = [
	{ route: 'RoomsListView', label: 'Rooms list', testID: 'owl-nav-rooms-list' },
	{ route: 'DirectoryView', label: 'Directory', testID: 'owl-nav-directory' },
	{ route: 'MediaAutoDownloadView', label: 'Media auto-download', testID: 'owl-nav-media-auto-download' },
	{ route: 'UserNotificationPrefView', label: 'Notification preferences', testID: 'owl-nav-user-notification-prefs' }
] as const;

const styles = StyleSheet.create({
	launcher: {
		flexGrow: 1,
		justifyContent: 'center',
		gap: 16,
		padding: 24,
		backgroundColor: colors.light.surfaceRoom
	},
	button: {
		backgroundColor: colors.light.buttonBackgroundPrimaryDefault,
		borderRadius: 12,
		paddingVertical: 16,
		alignItems: 'center'
	},
	buttonText: {
		color: colors.light.buttonFontPrimary,
		fontSize: 16,
		fontWeight: '700'
	}
});

// Orientation is driven from JS (not by rotating the device) so it works in CI
// and locally without Accessibility/synthetic input. LANDSCAPE_LEFT is fixed for
// determinism. iOS Info.plist already allows landscape and the Android
// MainActivity handles orientation changes, so no orientation boundaries change.
const setLandscape = () => ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
const setPortrait = () => ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);

const Launcher = () => {
	const navigation = useNavigation<any>();
	return (
		<ScrollView contentContainerStyle={styles.launcher} testID='owl-launcher'>
			<Pressable testID='owl-set-portrait' style={styles.button} onPress={setPortrait}>
				<Text style={styles.buttonText}>Portrait</Text>
			</Pressable>
			<Pressable testID='owl-set-landscape' style={styles.button} onPress={setLandscape}>
				<Text style={styles.buttonText}>Landscape</Text>
			</Pressable>
			{LINKS.map(link => (
				<Pressable key={link.route} testID={link.testID} style={styles.button} onPress={() => navigation.navigate(link.route)}>
					<Text style={styles.buttonText}>{link.label}</Text>
				</Pressable>
			))}
		</ScrollView>
	);
};

const OwlScreensNavigator = () => (
	<Stack.Navigator initialRouteName='Launcher' screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
		<Stack.Screen name='Launcher' component={Launcher} options={{ headerShown: false }} />
		<Stack.Screen name='RoomsListView' component={RoomsListView} />
		<Stack.Screen name='DirectoryView' component={DirectoryView} />
		<Stack.Screen name='MediaAutoDownloadView' component={MediaAutoDownloadView} />
		<Stack.Screen name='UserNotificationPrefView' component={UserNotificationPreferencesView} />
	</Stack.Navigator>
);

export default OwlScreensNavigator;
