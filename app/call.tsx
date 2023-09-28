import React, { useEffect } from 'react';
import { Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RNBootSplash from 'react-native-bootsplash';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import * as Haptics from 'expo-haptics';

import { AnimatedRinger } from './containers/AnimatedRinger';
import { CustomIcon, TIconsName } from './containers/CustomIcon';
import { colors } from './lib/constants';
import { getTheme, initialTheme } from './lib/methods/helpers/theme';
import customStyle from './views/Styles';

const CallButton = ({
	backgroundColor,
	iconName,
	label,
	onPress
}: {
	backgroundColor: string;
	iconName: TIconsName;
	label: string;
	onPress: () => void;
}) => (
	<View style={{ alignItems: 'center' }}>
		<TouchableOpacity onPress={() => onPress()} style={{ ...styles.callButton, backgroundColor }}>
			<CustomIcon name={iconName} size={40} color='#FFF' />
		</TouchableOpacity>
		<Text style={styles.callButtonLabel}>{label}</Text>
	</View>
);

const Call = () => {
	const iTheme = initialTheme();
	const theme = getTheme(iTheme);
	const color = colors[theme];

	useEffect(() => {
		(async () => {
			await RNBootSplash.hide({ fade: true });
			changeNavigationBarColor(color.callBackgroundColor, true, true);
		})();
	}, []);

	useEffect(() => {
		let count = 0;

		const interval = setInterval(() => {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
			count++;
			if (count >= 10) {
				clearInterval(interval);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	return (
		<>
			<StatusBar backgroundColor={color.callBackgroundColor} barStyle={'dark-content'} />
			<View style={{ flex: 1, backgroundColor: color.callBackgroundColor }}>
				<View style={{ flex: 2 }}>
					<View style={styles.topContainer}>
						<View style={styles.imageContainer}>
							<Image source={{ uri: 'https://i.ibb.co/VBsqb1k/download.jpg' }} style={styles.image} />
						</View>
						<Text style={styles.incomingCall}>Incoming Call</Text>
						<AnimatedRinger delay={0} />
						<AnimatedRinger delay={250} />
						<AnimatedRinger delay={500} />
						<AnimatedRinger delay={750} />
						<AnimatedRinger delay={1000} />
					</View>
				</View>
				<View style={styles.buttonsContainer}>
					<CallButton backgroundColor={color.cancelCallButton} iconName='phone-end' label='Reject' onPress={() => {}} />
					<CallButton backgroundColor={color.acceptCallButton} iconName='phone' label='Accept' onPress={() => {}} />
				</View>
			</View>
		</>
	);
};

export const styles = StyleSheet.create({
	callButton: {
		alignItems: 'center',
		justifyContent: 'center',
		height: 80,
		width: 80,
		borderRadius: 40
	},
	callButtonLabel: {
		color: '#FFF',
		marginTop: 16,
		...customStyle.textMedium
	},
	incomingCall: {
		color: '#FFF',
		position: 'absolute',
		zIndex: 1000,
		bottom: 100,
		fontSize: 20,
		...customStyle.textMedium
	},
	topContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'column'
	},
	buttonsContainer: { flex: 1, justifyContent: 'space-around', alignItems: 'center', flexDirection: 'row' },
	imageContainer: { overflow: 'hidden', borderRadius: 100, width: 200, height: 200, zIndex: 1000 },
	image: { width: 200, height: 200 }
});

export default Call;
