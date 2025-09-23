import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import {
	reopenLiveLocationModal,
	stopGlobalLiveLocation,
	isLiveLocationActive,
	addStatusChangeListener,
	removeStatusChangeListener,
	getCurrentLiveParams
} from './LiveLocationPreviewModal';

type Props = {
	onPress?: () => void;
};

export default function LiveLocationStatusBar({ onPress }: Props) {
	const [isActive, setIsActive] = useState(false);
	const [pulseAnim] = useState(new Animated.Value(1));

	useEffect(() => {
		// Check status initially
		setIsActive(isLiveLocationActive());

		// Listen for status changes using the callback system
		const handleStatusChange = (active: boolean) => {
			setIsActive(active);
		};

		addStatusChangeListener(handleStatusChange);

		return () => {
			removeStatusChangeListener(handleStatusChange);
		};
	}, []);

	useEffect(() => {
		if (isActive) {
			// Start pulsing animation
			const pulse = Animated.loop(
				Animated.sequence([
					Animated.timing(pulseAnim, {
						toValue: 1.3,
						duration: 1000,
						useNativeDriver: true
					}),
					Animated.timing(pulseAnim, {
						toValue: 1,
						duration: 1000,
						useNativeDriver: true
					})
				])
			);
			pulse.start();

			return () => pulse.stop();
		}
	}, [isActive, pulseAnim]);

	const handlePress = () => {
		if (onPress) {
			onPress();
		} else {
			reopenLiveLocationModal();
		}
	};

	const handleStop = () => {
		const params = getCurrentLiveParams();
		const currentUserIsOwner = params?.ownerName === /* current username from selector */ '';

		if (currentUserIsOwner) {
			// Owner: stop sharing
			stopGlobalLiveLocation();
		} else {
			// Viewer: just hide status bar
			setIsActive(false);
		}
	};

	if (!isActive) return null;

	return (
		<View style={styles.container}>
			<TouchableOpacity onPress={handlePress} style={styles.statusBar}>
				<Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
					<Text style={styles.icon}>📍</Text>
				</Animated.View>
				<View style={styles.textContainer}>
					<Text style={styles.title}>Live Location Active</Text>
					<Text style={styles.subtitle}>Tap to view • Updates every 10s</Text>
				</View>
			</TouchableOpacity>
			<TouchableOpacity onPress={handleStop} style={styles.stopButton}>
				<Text style={styles.stopText}>✕</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FF5722',
		paddingHorizontal: 16,
		paddingVertical: 12,
		shadowColor: '#000',
		shadowOpacity: 0.15,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 5,
		zIndex: 1000
	},
	statusBar: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	iconContainer: {
		marginRight: 12
	},
	icon: {
		fontSize: 18
	},
	textContainer: {
		flex: 1
	},
	title: {
		color: '#fff',
		fontSize: 15,
		fontWeight: '600',
		marginBottom: 2
	},
	subtitle: {
		color: 'rgba(255,255,255,0.8)',
		fontSize: 12
	},
	stopButton: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: 'rgba(255,255,255,0.2)',
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 12
	},
	stopText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: 'bold'
	}
});
