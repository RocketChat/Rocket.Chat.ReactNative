import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

import { useTheme } from '../../../theme';
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
	messageTimestamp?: string | Date | number;
	onPress?: () => void;
}

const LiveLocationCard: React.FC<LiveLocationCardProps> = ({ msg, isActive = true, messageTimestamp, onPress }) => {
	const { colors } = useTheme();

	const initialActiveState = useMemo(() => {
		const linkMatch = msg?.match(/rocketchat:\/\/live-location\?([^)]+)/);
		if (!linkMatch) return isActive;

		const params = new URLSearchParams(linkMatch[1]);
		const liveLocationId = params.get('liveLocationId');
		if (!liveLocationId) return isActive;

		return isActive;
	}, [msg, isActive]);

	const [cardIsActive, setCardIsActive] = useState(initialActiveState);

	const cardIsActiveRef = useRef(cardIsActive);
	useEffect(() => {
		cardIsActiveRef.current = cardIsActive;
	}, [cardIsActive]);

	const isMessageTooOld = (
		timestamp?: string | Date | number | { $date?: number; valueOf?: () => number; getTime?: () => number }
	) => {
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
				t =
					timestamp.$date ||
					timestamp.valueOf?.() ||
					timestamp.getTime?.() ||
					new Date(timestamp as unknown as string | number).getTime();
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
		const linkMatch = msg?.match(/rocketchat:\/\/live-location\?([^)]+)/);
		if (!linkMatch) return;

		const params = new URLSearchParams(linkMatch[1]);
		const thisCardLiveLocationId = params.get('liveLocationId') || null;

		if (!thisCardLiveLocationId) return;

		const currentParams = getCurrentLiveParams();
		const isOwnLiveLocation = currentParams && currentParams.liveLocationId === thisCardLiveLocationId;

		if (isOwnLiveLocation) {
			setCardIsActive(isLiveLocationActive());
		} else {
			const now = Date.now();
			let shouldBeActive = true;

			const idMatch = thisCardLiveLocationId.match(/^live_(\d+)_/);
			if (idMatch) {
				const messageTime = parseInt(idMatch[1], 10);
				const THIRTY_MINUTES_MS = 30 * 60 * 1000;
				const ageMs = now - messageTime;

				if (ageMs > THIRTY_MINUTES_MS) {
					shouldBeActive = false;
				}
			}

			setCardIsActive(shouldBeActive);

			isLiveLocationEnded(thisCardLiveLocationId).then(ended => {
				if (ended) {
					setCardIsActive(false);
				}
			});
		}

		const handleStatusChange = (active: boolean) => {
			const current = getCurrentLiveParams();
			if (current && current.liveLocationId === thisCardLiveLocationId) {
				setCardIsActive(active);
			}
		};

		const handleLiveLocationEnded = (endedId: string) => {
			if (endedId === thisCardLiveLocationId) {
				setCardIsActive(false);
			}
		};

		addStatusChangeListener(handleStatusChange);
		addLiveLocationEndedListener(handleLiveLocationEnded);

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

		const linkMatch = msg.match(/rocketchat:\/\/live-location\?([^)]+)/);
		const thisCardLiveLocationId = linkMatch ? new URLSearchParams(linkMatch[1]).get('liveLocationId') : null;
		const currentParams = getCurrentLiveParams();

		if (currentParams && currentParams.liveLocationId === thisCardLiveLocationId) {
			reopenLiveLocationModal();
		} else if (isLiveLocationActive()) {
			Alert.alert(I18n.t('Live_Location_Active'), I18n.t('Live_Location_Active_Block_Message'));
		} else if (linkMatch) {
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
			style={[
				styles.card,
				{
					backgroundColor: cardIsActive ? colors.surfaceLight : colors.surfaceDisabled,
					borderColor: cardIsActive ? colors.statusFontSuccess : colors.strokeLight,
					shadowColor: colors.fontDefault
				}
			]}
			onPress={handleCardPress}
			activeOpacity={cardIsActive ? 0.7 : 1}>
			<View style={styles.cardContent}>
				<View style={styles.iconContainer}>
					<Text style={styles.icon}>📍</Text>
					<View
						style={[styles.statusDot, { backgroundColor: cardIsActive ? colors.statusFontSuccess : colors.statusFontDanger }]}
					/>
				</View>
				<View style={styles.textContainer}>
					<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>{I18n.t('Live_Location')}</Text>
					<Text style={[styles.status, { color: cardIsActive ? colors.statusFontSuccess : colors.statusFontDanger }]}>
						{cardIsActive ? I18n.t('Active_Tap_to_view') : I18n.t('Inactive')}
					</Text>
				</View>
				{cardIsActive && (
					<View style={styles.pulseContainer}>
						<View style={[styles.pulse, styles.pulse1, { backgroundColor: colors.statusFontSuccess }]} />
						<View style={[styles.pulse, styles.pulse2, { backgroundColor: colors.statusFontSuccess }]} />
						<View style={[styles.pulse, styles.pulse3, { backgroundColor: colors.statusFontSuccess }]} />
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
		opacity: 0.6
	},
	pulse1: { transform: [{ scale: 1 }] },
	pulse2: { transform: [{ scale: 1.4 }], opacity: 0.4 },
	pulse3: { transform: [{ scale: 1.8 }], opacity: 0.2 }
});

export default LiveLocationCard;
