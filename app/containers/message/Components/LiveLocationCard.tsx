import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

import { useTheme, type TColors } from '../../../theme';
import Navigation from '../../../lib/navigation/appNavigation';
import {
	addStatusChangeListener,
	removeStatusChangeListener,
	getCurrentLiveParams,
	reopenLiveLocationModal,
	isLiveLocationActive
} from '../../../views/LocationShare/LiveLocationPreviewModal';
import {
	isLiveLocationEnded,
	addLiveLocationEndedListener,
	removeLiveLocationEndedListener
} from '../../../views/LocationShare/services/handleLiveLocationUrl';
import I18n from '../../../i18n';

interface LiveLocationCardProps {
	msg: string;
	isActive?: boolean;
	messageTimestamp?: string | Date | number; // accept number as well (epoch ms)
	author?: {
		_id: string;
		name?: string;
		username?: string;
	};
	onPress?: () => void;
}

const LiveLocationCard: React.FC<LiveLocationCardProps> = ({ msg, isActive = true, messageTimestamp, author: _author, onPress }) => {
	const { colors } = useTheme();
	
	// Calculate initial active state
	const initialActiveState = useMemo(() => {
		const linkMatch = msg?.match(/rocketchat:\/\/live-location\?([^)]+)/);
		if (!linkMatch) return isActive;
		
		const params = new URLSearchParams(linkMatch[1]);
		const liveLocationId = params.get('liveLocationId');
		if (!liveLocationId) return isActive;
		
		return isActive;
	}, [msg, isActive]);
	
	const [cardIsActive, setCardIsActive] = useState(initialActiveState);
	
	// Keep latest active state accessible inside closures (e.g., setInterval)
	const cardIsActiveRef = useRef(cardIsActive);
	useEffect(() => {
		cardIsActiveRef.current = cardIsActive;
	}, [cardIsActive]);

	const styles = useMemo(() => createStyles(colors, cardIsActive), [colors, cardIsActive]);

	// Treat missing timestamps as recent
	const isMessageTooOld = (timestamp?: string | Date | number | { $date?: number; valueOf?: () => number; getTime?: () => number }) => {
		if (timestamp == null) {
			return false;
		}

		try {
			let t: number;
			
			if (typeof timestamp === 'number') {
				t = timestamp;
			} else if (typeof timestamp === 'string') {
				t = new Date(timestamp).getTime();
			} else if (timestamp instanceof Date) {
				t = timestamp.getTime();
			} else if (typeof timestamp === 'object') {
				// Try to extract timestamp from object
				t = timestamp.$date || timestamp.valueOf?.() || timestamp.getTime?.() || new Date(timestamp as unknown as string | number).getTime();
			} else {
				t = new Date(timestamp as unknown as string | number).getTime();
			}

			if (Number.isNaN(t) || t <= 0) {
				return false;
			}

			const now = Date.now();
			const TEN_MINUTES_MS = 10 * 60 * 1000;
			const ageMs = now - t;
			const isTooOld = ageMs > TEN_MINUTES_MS;

			return isTooOld;
		} catch (error) {
			return false;
		}
	};

	useEffect(() => {
		// Parse deep link and extract params
		const linkMatch = msg?.match(/rocketchat:\/\/live-location\?([^)]+)/);
		if (!linkMatch) return;

		const params = new URLSearchParams(linkMatch[1]);
		const thisCardLiveLocationId = params.get('liveLocationId') || null;

		if (!thisCardLiveLocationId) return;

		// Is this the user's own session?
		const currentParams = getCurrentLiveParams();
		const isOwnLiveLocation = currentParams && currentParams.liveLocationId === thisCardLiveLocationId;

		if (isOwnLiveLocation) {
			// Use global tracker status
			setCardIsActive(isLiveLocationActive());
		} else {
			// For others, mark stale by id timestamp when possible
			const now = Date.now();
			let shouldBeActive = true;
			
			// live_TIMESTAMP_randomstring
			const idMatch = thisCardLiveLocationId.match(/^live_(\d+)_/);
			if (idMatch) {
				const messageTime = parseInt(idMatch[1], 10);
				const THIRTY_MINUTES_MS = 30 * 60 * 1000;
				const ageMs = now - messageTime;
				
				if (ageMs > THIRTY_MINUTES_MS) {
					shouldBeActive = false;
				}
			}
			
			// Set initial state
			setCardIsActive(shouldBeActive);
			
			// Check if explicitly ended (async) - this can override the age check
			isLiveLocationEnded(thisCardLiveLocationId).then(ended => {
				if (ended) {
					setCardIsActive(false);
				}
			});
		}

		// Owner-only status changes
		const handleStatusChange = (active: boolean) => {
			const current = getCurrentLiveParams();
			if (current && current.liveLocationId === thisCardLiveLocationId) {
				setCardIsActive(active);
			}
		};

		// Explicit end for this id
		const handleLiveLocationEnded = (endedId: string) => {
			if (endedId === thisCardLiveLocationId) {
				setCardIsActive(false);
			}
		};

		addStatusChangeListener(handleStatusChange);
		addLiveLocationEndedListener(handleLiveLocationEnded);


		// Stale check every 5 minutes, read latest state from ref
		const staleCheck = setInterval(() => {
			if (isMessageTooOld(messageTimestamp) && cardIsActiveRef.current) {
				setCardIsActive(false);
			}
		}, 5 * 60 * 1000);

		return () => {
			removeStatusChangeListener(handleStatusChange);
			removeLiveLocationEndedListener(handleLiveLocationEnded);
			clearInterval(staleCheck);
		};
	}, [msg, isActive, messageTimestamp]);

	const handleCardPress = () => {
		if (!cardIsActive) {
			Alert.alert(I18n.t('Live_Location_Ended_Title'), I18n.t('Live_Location_Ended_Message'));
			onPress?.();
			return;
		}

		// If this card matches the active session, reopen it
		const linkMatch = msg.match(/rocketchat:\/\/live-location\?([^)]+)/);
		const thisCardLiveLocationId = linkMatch ? new URLSearchParams(linkMatch[1]).get('liveLocationId') : null;
		const currentParams = getCurrentLiveParams();

		if (currentParams && currentParams.liveLocationId === thisCardLiveLocationId) {
			// Reopen current session
			reopenLiveLocationModal();
		} else if (isLiveLocationActive()) {
			// Block viewing others while sharing
			Alert.alert(
				I18n.t('Live_Location_Active'),
				I18n.t('Live_Location_Active_Block_Message')
			);
		} else if (linkMatch) {
			// Navigate to viewer mode
			const params = new URLSearchParams(linkMatch[1]);
			const liveLocationId = params.get('liveLocationId');
			const rid = params.get('rid');
			const msgId = params.get('msgId');
 			if (!rid || !(msgId || liveLocationId)) {
				Alert.alert(I18n.t('Error'), I18n.t('Could_not_open_live_location'));
				return;
			}
			Navigation.navigate('LiveLocationViewerModal', {
				rid,
   				msgId: msgId || (liveLocationId as string)
 			});
		} else {
			Alert.alert(I18n.t('Error'), I18n.t('Could_not_open_live_location'));
		}

		onPress?.();
	};

	return (
		<TouchableOpacity
			style={styles.card}
			onPress={handleCardPress}
			activeOpacity={cardIsActive ? 0.7 : 1}
		>
			<View style={styles.cardContent}>
				<View style={styles.iconContainer}>
					<Text style={styles.icon}>📍</Text>
					<View style={styles.statusDot} />
				</View>
				<View style={styles.textContainer}>
					<Text style={styles.title}>{I18n.t('Live_Location')}</Text>
					<Text style={styles.status}>
						{cardIsActive ? I18n.t('Active_Tap_to_view') : I18n.t('Inactive')}
					</Text>
				</View>
				{cardIsActive && (
					<View style={styles.pulseContainer}>
						<View style={[styles.pulse, styles.pulse1]} />
						<View style={[styles.pulse, styles.pulse2]} />
						<View style={[styles.pulse, styles.pulse3]} />
					</View>
				)}
			</View>
		</TouchableOpacity>
	);
};

/* eslint-disable react-native/no-unused-styles */
const createStyles = (colors: TColors, isActive: boolean) =>
	StyleSheet.create({
		card: {
			borderRadius: 12,
			borderWidth: 1,
			padding: 16,
			marginVertical: 4,
			backgroundColor: isActive ? colors.surfaceLight : colors.surfaceDisabled,
			borderColor: isActive ? colors.statusFontSuccess : colors.strokeLight,
			shadowColor: colors.fontDefault,
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.1,
			shadowRadius: 4,
			elevation: 3
		},
		cardContent: {
			flexDirection: 'row',
			alignItems: 'center'
		},
		iconContainer: {
			position: 'relative',
			marginRight: 12
		},
		icon: {
			fontSize: 24
		},
		statusDot: {
			position: 'absolute',
			top: -2,
			right: -2,
			width: 8,
			height: 8,
			borderRadius: 4,
			backgroundColor: isActive ? colors.statusFontSuccess : colors.statusFontDanger
		},
		textContainer: {
			flex: 1
		},
		title: {
			fontSize: 16,
			fontWeight: '600',
			marginBottom: 2,
			color: colors.fontTitlesLabels
		},
		status: {
			fontSize: 14,
			fontWeight: '500',
			color: isActive ? colors.statusFontSuccess : colors.statusFontDanger
		},
		pulseContainer: {
			position: 'relative',
			width: 20,
			height: 20,
			justifyContent: 'center',
			alignItems: 'center'
		},
		pulse: {
			position: 'absolute',
			width: 12,
			height: 12,
			borderRadius: 6,
			opacity: 0.6,
			backgroundColor: colors.statusFontSuccess
		},
		pulse1: { transform: [{ scale: 1 }] },
		pulse2: { transform: [{ scale: 1.4 }], opacity: 0.4 },
		pulse3: { transform: [{ scale: 1.8 }], opacity: 0.2 }
	});

export default LiveLocationCard;
