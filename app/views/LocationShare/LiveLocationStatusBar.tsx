import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, InteractionManager, Linking } from 'react-native';
import {
	reopenLiveLocationModal,
	stopGlobalLiveLocation,
	isLiveLocationActive,
	addStatusChangeListener,
	removeStatusChangeListener,
	getCurrentLiveParams
} from './LiveLocationPreviewModal';
import { handleLiveLocationUrl, isLiveMessageLink } from './services/handleLiveLocationUrl';
import { useAppSelector } from '../../lib/hooks';
import { getUserSelector } from '../../selectors/login';

type Props = { onPress?: () => void };

export default function LiveLocationStatusBar({ onPress }: Props) {
	const [isActive, setIsActive] = useState(false);
	const [pulseAnim] = useState(new Animated.Value(1));
	const username = useAppSelector(state => getUserSelector(state).username);

	// mounted guard
	const mounted = useRef(true);
	useEffect(
		() => () => {
			mounted.current = false;
		},
		[]
	);
	const safeSet = (fn: () => void) => {
		if (mounted.current) fn();
	};

	// subscribe to global live-location status
	useEffect(() => {
		safeSet(() => setIsActive(isLiveLocationActive()));
		const handleStatusChange = (active: boolean) => safeSet(() => setIsActive(active));
		addStatusChangeListener(handleStatusChange);
		return () => removeStatusChangeListener(handleStatusChange);
	}, []);

	// GLOBAL DEEPLINK LISTENER (works around openLink.ts)
	useEffect(() => {
		const sub = Linking.addEventListener('url', ({ url }) => {
			if (isLiveMessageLink(url)) {
				handleLiveLocationUrl(url);
			}
		});
		// also handle the case when app is cold-started by the link
		Linking.getInitialURL().then(url => {
			if (url && isLiveMessageLink(url)) {
				handleLiveLocationUrl(url);
			}
		});
		return () => sub.remove();
	}, []);

	// pulse animation lifecycle
	useEffect(() => {
		if (!isActive) return;
		const pulse = Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnim, { toValue: 1.3, duration: 1000, useNativeDriver: true }),
				Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
			])
		);
		pulse.start();
		return () => pulse.stop();
	}, [isActive, pulseAnim]);

	const handlePress = () => {
		if (onPress) onPress();
		else InteractionManager.runAfterInteractions(reopenLiveLocationModal);
	};

	const stoppingRef = useRef(false);
	const handleStop = async () => {
		if (stoppingRef.current) return;
		stoppingRef.current = true;

		const params = getCurrentLiveParams();
		const currentUserIsOwner = params?.ownerName && username ? params.ownerName === username : !!params?.isTracking;

		if (currentUserIsOwner) {
			try {
				await stopGlobalLiveLocation(); // sends “Ended” and clears globals
			} finally {
				safeSet(() => setIsActive(false));
				stoppingRef.current = false;
			}
		} else {
			safeSet(() => setIsActive(false));
			stoppingRef.current = false;
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
	statusBar: { flex: 1, flexDirection: 'row', alignItems: 'center' },
	iconContainer: { marginRight: 12 },
	icon: { fontSize: 18 },
	textContainer: { flex: 1 },
	title: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 2 },
	subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
	stopButton: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: 'rgba(255,255,255,0.2)',
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 12
	},
	stopText: { color: '#fff', fontSize: 14, fontWeight: 'bold' }
});
