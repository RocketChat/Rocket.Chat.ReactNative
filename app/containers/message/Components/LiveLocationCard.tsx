import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

import { useTheme } from '../../../theme';
import {
	MAP_PROVIDER_PREFERENCE_KEY,
	GOOGLE_MAPS_API_KEY_PREFERENCE_KEY,
	OSM_API_KEY_PREFERENCE_KEY,
	MAP_PROVIDER_DEFAULT
} from '../../../lib/constants/keys';
import { themes } from '../../../lib/constants/colors';
import Navigation from '../../../lib/navigation/appNavigation';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { useUserPreferences } from '../../../lib/methods/userPreferences';
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
import { MapProviderName } from '../../../views/LocationShare/services/mapProviders';

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

const LiveLocationCard: React.FC<LiveLocationCardProps> = ({ msg, isActive = true, messageTimestamp, author, onPress }) => {
	const { theme } = useTheme();
	const [cardIsActive, setCardIsActive] = useState(isActive);
	
	// Get viewer's own API keys from user preferences
	const userId = useAppSelector(state => state.login.user.id);
	const [viewerMapProvider] = useUserPreferences<MapProviderName>(`${MAP_PROVIDER_PREFERENCE_KEY}_${userId}`, MAP_PROVIDER_DEFAULT);
	const [viewerGoogleApiKey] = useUserPreferences<string>(`${GOOGLE_MAPS_API_KEY_PREFERENCE_KEY}_${userId}`, '');
	const [viewerOsmApiKey] = useUserPreferences<string>(`${OSM_API_KEY_PREFERENCE_KEY}_${userId}`, '');

	// Consider messages without a timestamp as *recent* (not old)
	const isMessageTooOld = (timestamp?: string | Date | number | any) => {
		if (timestamp == null) {
			console.log('[LiveLocationCard] No timestamp provided, assuming recent (active)');
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
				t = timestamp.$date || timestamp.valueOf?.() || timestamp.getTime?.() || new Date(timestamp).getTime();
			} else {
				t = new Date(timestamp).getTime();
			}

			if (Number.isNaN(t) || t <= 0) {
				console.log('[LiveLocationCard] Could not parse timestamp, assuming recent (active)');
				return false;
			}

			const now = Date.now();
			const TEN_MINUTES_MS = 10 * 60 * 1000;
			const ageMs = now - t;
			const isTooOld = ageMs > TEN_MINUTES_MS;

			console.log('[LiveLocationCard] Age check:', {
				originalTimestamp: timestamp,
				parsedTime: t,
				messageTime: new Date(t).toISOString(),
				now: new Date(now).toISOString(),
				ageMinutes: Math.floor(ageMs / (60 * 1000)),
				isTooOld
			});

			return isTooOld;
		} catch (error) {
			console.log('[LiveLocationCard] Error parsing timestamp, assuming recent (active):', error);
			return false;
		}
	};

	useEffect(() => {
		// Parse deep link and extract params
		const linkMatch = msg?.match(/rocketchat:\/\/live-location\?([^)]+)/);
		if (!linkMatch) {
			setCardIsActive(isActive);
			return;
		}

		const params = new URLSearchParams(linkMatch[1]);
		const thisCardLiveLocationId = params.get('liveLocationId') || null;

		if (!thisCardLiveLocationId) {
			setCardIsActive(isActive);
			return;
		}

		// Check if this is the current user's own live location session
		const currentParams = getCurrentLiveParams();
		const isOwnLiveLocation = currentParams && currentParams.liveLocationId === thisCardLiveLocationId;

		if (isOwnLiveLocation) {
			// For own live location, use the global tracker status
			setCardIsActive(isLiveLocationActive());
		} else {
			// For other users' live locations: check if it should be considered old
			// Use a simple heuristic: extract timestamp from the live location ID if possible
			const now = Date.now();
			let shouldBeActive = true;
			
			// Try to extract timestamp from live location ID (format: live_TIMESTAMP_randomstring)
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

		// Listen for status changes (owner only)
		const handleStatusChange = (active: boolean) => {
			const current = getCurrentLiveParams();
			if (current && current.liveLocationId === thisCardLiveLocationId) {
				setCardIsActive(active);
			}
		};

		// Listen for explicit end of this specific live location
		const handleLiveLocationEnded = (endedId: string) => {
			if (endedId === thisCardLiveLocationId) {
				setCardIsActive(false);
			}
		};

		addStatusChangeListener(handleStatusChange);
		addLiveLocationEndedListener(handleLiveLocationEnded);

		// Periodic stale check every 5 minutes
		const staleCheck = setInterval(() => {
			if (isMessageTooOld(messageTimestamp) && cardIsActive) {
				setCardIsActive(false);
			}
		}, 5 * 60 * 1000);

		return () => {
			removeStatusChangeListener(handleStatusChange);
			removeLiveLocationEndedListener(handleLiveLocationEnded);
			clearInterval(staleCheck);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [msg, isActive, messageTimestamp]);

	const handleCardPress = () => {
		if (!cardIsActive) {
			Alert.alert('Live Location Ended', 'This live location session has ended.');
			onPress?.();
			return;
		}

		// Check if this card matches the currently active live location
		const linkMatch = msg.match(/rocketchat:\/\/live-location\?([^)]+)/);
		const thisCardLiveLocationId = linkMatch ? new URLSearchParams(linkMatch[1]).get('liveLocationId') : null;
		const currentParams = getCurrentLiveParams();

		if (currentParams && currentParams.liveLocationId === thisCardLiveLocationId) {
			// This card matches the current active session, reopen it
			reopenLiveLocationModal();
		} else if (isLiveLocationActive()) {
			// User is already sharing their own live location; block viewing others
			Alert.alert(
				'Live Location Active',
				'You are currently sharing your live location. Please stop your current live location sharing before viewing others.'
			);
		} else if (linkMatch) {
			// Navigate to viewer mode (not tracking)
			const params = new URLSearchParams(linkMatch[1]);
			const liveLocationId = params.get('liveLocationId');
			const rid = params.get('rid');
			const tmid = params.get('tmid') || undefined;
			const ownerProvider = params.get('provider') as MapProviderName;
			
			// Use viewer's preferred provider and API keys, not the owner's
			const finalProvider = viewerMapProvider || ownerProvider || 'google';

			Navigation.navigate('LiveLocationPreviewModal', {
				rid: rid!,
				tmid,
				provider: finalProvider,
				googleKey: finalProvider === 'google' ? viewerGoogleApiKey : undefined,
				osmKey: finalProvider === 'osm' ? viewerOsmApiKey : undefined,
				liveLocationId: liveLocationId!,
				isTracking: false,
				ownerName: author?.name || author?.username || 'Other User'
			});
		} else {
			Alert.alert('Error', 'Could not open live location');
		}

		onPress?.();
	};

	return (
		<TouchableOpacity
			style={[
				styles.card,
				{
					backgroundColor: cardIsActive ? themes[theme].surfaceLight : themes[theme].surfaceDisabled,
					borderColor: cardIsActive ? '#27ae60' : themes[theme].strokeLight
				}
			]}
			onPress={handleCardPress}
			activeOpacity={cardIsActive ? 0.7 : 1}
		>
			<View style={styles.cardContent}>
				<View style={styles.iconContainer}>
					<Text style={styles.icon}>📍</Text>
					<View
						style={[
							styles.statusDot,
							{ backgroundColor: cardIsActive ? '#27ae60' : '#e74c3c' }
						]}
					/>
				</View>
				<View style={styles.textContainer}>
					<Text style={[styles.title, { color: themes[theme].fontTitlesLabels }]}>Live Location</Text>
					<Text
						style={[
							styles.status,
							{ color: cardIsActive ? '#27ae60' : '#e74c3c' }
						]}
					>
						{cardIsActive ? 'Active • Tap to view' : 'Inactive'}
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

const styles = StyleSheet.create({
	card: {
		borderRadius: 12,
		borderWidth: 1,
		padding: 16,
		marginVertical: 4,
		shadowColor: '#000',
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
		borderRadius: 4
	},
	textContainer: {
		flex: 1
	},
	title: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 2
	},
	status: {
		fontSize: 14,
		fontWeight: '500'
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
		backgroundColor: '#27ae60'
	},
	pulse1: { transform: [{ scale: 1 }] },
	pulse2: { transform: [{ scale: 1.4 }], opacity: 0.4 },
	pulse3: { transform: [{ scale: 1.8 }], opacity: 0.2 }
});

export default LiveLocationCard;
