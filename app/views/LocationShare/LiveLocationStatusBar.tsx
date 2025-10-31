import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, InteractionManager, Linking } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

import {
	reopenLiveLocationModal,
	stopGlobalLiveLocation,
	isLiveLocationMinimized,
	addMinimizedStatusListener,
	removeMinimizedStatusListener,
	getCurrentLiveParams
} from './LiveLocationPreviewModal';
import { handleLiveLocationUrl, isLiveMessageLink } from './services/handleLiveLocationUrl';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../selectors/login';
import I18n from '../../i18n';
import { useTheme, type TColors } from '../../theme';

type Props = { onPress?: () => void };

export default function LiveLocationStatusBar({ onPress }: Props) {
	const [isActive, setIsActive] = useState(false);
	const pulseAnim = useSharedValue(1);
	const username = useAppSelector(state => getUserSelector(state).username);
	const { colors } = useTheme();

	const styles = useMemo(() => createStyles(colors), [colors]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: pulseAnim.value }]
	}));

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

	// subscribe to global minimized status
	useEffect(() => {
		safeSet(() => setIsActive(isLiveLocationMinimized()));
		const handleStatusChange = (minimized: boolean) => safeSet(() => setIsActive(minimized));
		addMinimizedStatusListener(handleStatusChange);
		return () => removeMinimizedStatusListener(handleStatusChange);
	}, []);

	useEffect(() => {
		const sub = Linking.addEventListener('url', ({ url }) => {
			if (isLiveMessageLink(url)) {
				handleLiveLocationUrl(url);
			}
		});
		// also handle cold-start by link
		Linking.getInitialURL().then(url => {
			if (url && isLiveMessageLink(url)) {
				handleLiveLocationUrl(url);
			}
		});
		return () => sub.remove();
	}, []);

	// pulse animation
	useEffect(() => {
		if (isActive) {
			pulseAnim.value = withRepeat(withTiming(1.3, { duration: 1000, easing: Easing.inOut(Easing.ease) }), -1, true);
		} else {
			pulseAnim.value = withTiming(1, { duration: 300 });
		}
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
				<Animated.View style={[styles.iconContainer, animatedStyle]}>
					<Text style={styles.icon}>📍</Text>
				</Animated.View>
				<View style={styles.textContainer}>
					<Text style={styles.title}>{I18n.t('Live_Location_Active')}</Text>
					<Text style={styles.subtitle}>{I18n.t('Tap_to_view_Updates_every_10s')}</Text>
				</View>
			</TouchableOpacity>
			<TouchableOpacity onPress={handleStop} style={styles.stopButton}>
				<Text style={styles.stopText}>✕</Text>
			</TouchableOpacity>
		</View>
	);
}

/* eslint-disable react-native/no-unused-styles */
const createStyles = (colors: TColors) =>
	StyleSheet.create({
		container: {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: colors.buttonBackgroundDangerDefault,
			paddingHorizontal: 16,
			paddingVertical: 12,
			shadowColor: colors.fontDefault,
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
		title: { color: colors.fontWhite, fontSize: 15, fontWeight: '600', marginBottom: 2 },
		subtitle: { color: colors.fontWhite, fontSize: 12, opacity: 0.8 },
		stopButton: {
			width: 28,
			height: 28,
			borderRadius: 14,
			backgroundColor: colors.fontWhite, // theme token
			alignItems: 'center',
			justifyContent: 'center',
			marginLeft: 12,
			borderWidth: 1,
			borderColor: colors.strokeLight || colors.surfaceTint
		},
		stopText: {
			color: colors.buttonBackgroundDangerDefault,
			fontSize: 16,
			fontWeight: '700'
		}
	});
