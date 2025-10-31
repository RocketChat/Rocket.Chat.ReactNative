import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, TouchableOpacity, Linking } from 'react-native';
import { Image as ExpoImage, type ImageErrorEventData } from 'expo-image';

import I18n from '../../i18n';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import Navigation from '../../lib/navigation/appNavigation';
import { useTheme } from '../../theme';
import { LiveLocationApi, serverToMobileCoords } from './services/liveLocationApi';
import { addLiveLocationEndedListener, removeLiveLocationEndedListener } from './services/handleLiveLocationUrl';
import { staticMapUrl, providerLabel, mapsDeepLink, providerAttribution } from './services/mapProviders';
import type { MapProviderName } from './services/mapProviders';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { useUserPreferences } from '../../lib/methods/userPreferences';
import { MAP_PROVIDER_PREFERENCE_KEY, MAP_PROVIDER_DEFAULT } from '../../lib/constants/keys';

export interface LiveLocationViewerModalProps {
	route: {
		params: {
			rid: string;
			msgId: string;
			provider?: 'osm' | 'google';
		};
	};
}

interface LiveLocationData {
	messageId: string;
	ownerId: string;
	ownerUsername: string;
	ownerName: string;
	isActive: boolean;
	startedAt?: number;
	lastUpdateAt?: number;
	stoppedAt?: number;
	coords: {
		latitude: number;
		longitude: number;
		accuracy?: number;
	};
	expiresAt?: number;
	version: number;
}

const BLURHASH_PLACEHOLDER = 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH';

const OSM_HEADERS = {
	'User-Agent': 'RocketChatMobile/1.0 (+https://rocket.chat) contact: mobile@rocket.chat',
	Referer: 'https://rocket.chat'
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 20
	},
	content: {
		width: '100%',
		maxWidth: 400,
		borderRadius: 20,
		padding: 24,
		shadowOpacity: 0.15,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 6 },
		elevation: 8,
		borderWidth: 1
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 16,
		paddingHorizontal: 4
	},
	titleContainer: {
		flex: 1,
		alignItems: 'center'
	},
	title: {
		fontSize: 20,
		fontWeight: '700',
		textAlign: 'center'
	},
	ownerName: {
		fontSize: 14,
		marginTop: 4,
		fontWeight: '500'
	},
	statusContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 20,
		borderWidth: 1
	},
	statusDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginRight: 8
	},
	statusText: {
		fontSize: 14,
		fontWeight: '600'
	},
	infoContainer: {
		marginBottom: 20,
		alignItems: 'center',
		padding: 16,
		borderRadius: 12,
		borderWidth: 1
	},
	coordsLine: {
		fontSize: 15,
		fontWeight: '600',
		textAlign: 'center',
		marginBottom: 6
	},
	timestamp: {
		fontSize: 12,
		textAlign: 'center',
		fontWeight: '500'
	},
	mapLinkText: {
		fontSize: 16,
		fontWeight: '700',
		textAlign: 'center',
		marginBottom: 16,
		paddingVertical: 8
	},

	mapContainer: {
		borderRadius: 12,
		overflow: 'hidden',
		marginBottom: 16,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
		borderWidth: 1
	},
	mapImage: {
		width: '100%',
		height: 220
	},
	mapPlaceholder: {
		width: '100%',
		height: 220,
		justifyContent: 'center',
		alignItems: 'center'
	},
	loadingText: {
		marginTop: 12,
		fontSize: 14,
		fontWeight: '500'
	},
	attribution: {
		fontSize: 10,
		textAlign: 'center',
		marginBottom: 12
	},
	pinOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center'
	},
	pinText: { fontSize: 24 },
	liveIndicator: {
		fontSize: 13,
		textAlign: 'center',
		marginBottom: 20,
		fontStyle: 'italic',
		fontWeight: '600'
	},
	buttons: {
		flexDirection: 'row',
		gap: 16,
		marginTop: 8
	},
	btn: {
		flex: 1,
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: 'center',
		borderWidth: 2,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2
	},
	btnText: {
		fontWeight: '700',
		fontSize: 16
	},
	errorText: {
		fontSize: 16,
		textAlign: 'center',
		marginBottom: 16
	}
});

const LiveLocationViewerModal = ({ route }: LiveLocationViewerModalProps): React.ReactElement => {
	const { rid, msgId, provider: routeProvider } = route.params;
	const { colors } = useTheme();
	const [loading, setLoading] = useState(true);
	const [liveLocationData, setLiveLocationData] = useState<LiveLocationData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [mapImageUrl, setMapImageUrl] = useState<string>('');
	const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const previousActiveState = useRef<boolean | null>(null);

	const currentUserId = useAppSelector(state => state.login.user.id);
	const [viewerMapProvider] = useUserPreferences<MapProviderName>(
		`${MAP_PROVIDER_PREFERENCE_KEY}_${currentUserId}`,
		MAP_PROVIDER_DEFAULT
	);

	const provider = viewerMapProvider || routeProvider || 'osm';

	const convertTimestamp = (value: unknown): number | undefined => {
		if (value && typeof value === 'object') {
			const objValue = value as Record<string, unknown>;
			if (typeof objValue.date === 'number') return objValue.date;
			if (typeof objValue.$date === 'number') return objValue.$date;
			if (typeof objValue.seconds === 'number') return objValue.seconds * 1000;
		}
		if (value instanceof Date) {
			const t = value.getTime();
			return Number.isFinite(t) ? t : undefined;
		}
		if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
			return value;
		}
		if (typeof value === 'string') {
			const iso = new Date(value);
			if (!isNaN(iso.getTime())) return iso.getTime();
			const parsed = parseInt(value, 10);
			if (Number.isFinite(parsed) && parsed > 0) return parsed;
		}
		return undefined;
	};

	const fetchLiveLocation = useCallback(async () => {
		try {
			const response = await LiveLocationApi.get(rid, msgId);

			const mobileCoords = serverToMobileCoords(response.coords);

			const responseData = response as Record<string, unknown>;
			const lastUpdateAt =
				convertTimestamp(response.lastUpdateAt) ??
				convertTimestamp(responseData.ownerLastUpdateAt) ??
				convertTimestamp(responseData.updatedAt);

			const startedAt = convertTimestamp(response.startedAt) ?? convertTimestamp(responseData.ownerStartedAt);

			const stoppedAt = response.stoppedAt ? convertTimestamp(response.stoppedAt) : undefined;
			const expiresAt = response.expiresAt ? convertTimestamp(response.expiresAt) : undefined;

			const liveData: LiveLocationData = {
				...response,
				coords: mobileCoords,
				startedAt,
				lastUpdateAt,
				stoppedAt,
				expiresAt
			};

			setLiveLocationData(liveData);
			setError(null);

			if (mobileCoords) {
				const mapResult = staticMapUrl('osm', mobileCoords, { zoom: 15 });
				setMapImageUrl(mapResult.url);
			}
		} catch (err) {
			setError((err as Error).message || 'Failed to load live location');
		} finally {
			setLoading(false);
		}
	}, [rid, msgId]);

	const startPeriodicUpdates = useCallback(() => {
		if (liveLocationData?.isActive) {
			updateIntervalRef.current = setInterval(() => {
				fetchLiveLocation();
			}, 10000);
		}
	}, [liveLocationData?.isActive, fetchLiveLocation]);

	const stopPeriodicUpdates = useCallback(() => {
		if (updateIntervalRef.current) {
			clearInterval(updateIntervalRef.current);
			updateIntervalRef.current = null;
		}
	}, []);

	const cacheKey = useMemo(() => {
		const lat = liveLocationData?.coords?.latitude;
		const lon = liveLocationData?.coords?.longitude;
		return lat && lon ? `osm-${lat.toFixed(5)}-${lon.toFixed(5)}-z15-v2` : undefined;
	}, [liveLocationData?.coords?.latitude, liveLocationData?.coords?.longitude]);

	const openInMaps = async () => {
		if (!liveLocationData?.coords) return;

		try {
			const mapUrl = await mapsDeepLink(provider as MapProviderName, liveLocationData.coords);
			if (mapUrl) {
				await Linking.openURL(mapUrl);
			}
		} catch (err) {
			Alert.alert(I18n.t('error-open-maps-application'));
		}
	};

	useEffect(() => {
		const onEnded = (endedId: string) => {
			if (endedId === msgId) {
				stopPeriodicUpdates();
				Navigation.back();
			}
		};
		addLiveLocationEndedListener(onEnded);
		return () => removeLiveLocationEndedListener(onEnded);
	}, [msgId, stopPeriodicUpdates]);

	useEffect(() => {
		setLiveLocationData(null);
		setError(null);
		setMapImageUrl('');
		setLoading(true);

		fetchLiveLocation();
		return () => {
			stopPeriodicUpdates();
		};
	}, [fetchLiveLocation, stopPeriodicUpdates]);

	useEffect(() => {
		if (liveLocationData) {
			if (liveLocationData.isActive) {
				startPeriodicUpdates();
				previousActiveState.current = true;
			} else {
				stopPeriodicUpdates();
				if (previousActiveState.current === true) {
					Navigation.back();
				}
				previousActiveState.current = false;
			}
		}
		return () => {
			stopPeriodicUpdates();
		};
	}, [liveLocationData, startPeriodicUpdates, stopPeriodicUpdates]);

	const handleClose = () => {
		stopPeriodicUpdates();
		Navigation.back();
	};

	const formatTimestamp = (timestamp?: number) => {
		if (!timestamp || !Number.isFinite(timestamp) || timestamp <= 0) {
			return '—';
		}
		try {
			const date = new Date(timestamp);
			if (isNaN(date.getTime())) {
				return '—';
			}
			return date.toLocaleTimeString();
		} catch (error) {
			return '—';
		}
	};

	if (loading) {
		return (
			<SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceLight }]}>
				<StatusBar />
				<View
					style={[
						styles.content,
						{ backgroundColor: colors.surfaceLight, shadowColor: colors.fontDefault, borderColor: colors.strokeExtraLight }
					]}>
					<ActivityIndicator size='large' color={colors.buttonBackgroundPrimaryDefault} />
					<Text style={[styles.loadingText, { color: colors.fontSecondaryInfo }]}>{I18n.t('Loading_live_location')}</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (error || !liveLocationData) {
		return (
			<SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceLight }]}>
				<StatusBar />
				<View
					style={[
						styles.content,
						{ backgroundColor: colors.surfaceLight, shadowColor: colors.fontDefault, borderColor: colors.strokeExtraLight }
					]}>
					<Text style={[styles.errorText, { color: colors.buttonBackgroundDangerDefault }]}>
						{error || I18n.t('Live_location_not_found')}
					</Text>
					<TouchableOpacity
						onPress={handleClose}
						style={[
							styles.btn,
							{ borderColor: colors.strokeExtraLight, backgroundColor: colors.surfaceLight, shadowColor: colors.fontDefault }
						]}>
						<Text style={[styles.btnText, { color: colors.fontTitlesLabels }]}>{I18n.t('Close')}</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.surfaceLight }]}>
			<View
				style={[
					styles.content,
					{ backgroundColor: colors.surfaceLight, shadowColor: colors.fontDefault, borderColor: colors.strokeExtraLight }
				]}>
				<View style={styles.header}>
					<View style={styles.titleContainer}>
						<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>📍 {I18n.t('Live_Location')}</Text>
						<Text style={[styles.ownerName, { color: colors.fontSecondaryInfo }]}>
							{I18n.t('Shared_By')} {liveLocationData.ownerUsername}
						</Text>
					</View>
				</View>

				<View style={[styles.statusContainer, { backgroundColor: colors.surfaceTint, borderColor: colors.strokeExtraLight }]}>
					<View
						style={[
							styles.statusDot,
							{ backgroundColor: liveLocationData.isActive ? colors.userPresenceOnline : colors.buttonBackgroundDangerDefault }
						]}
					/>
					<Text style={[styles.statusText, { color: colors.fontHint }]}>
						{liveLocationData.isActive ? I18n.t('Live_Location_Active') : I18n.t('Live_Location_Inactive')}
					</Text>
				</View>

				{liveLocationData.coords && (
					<View style={[styles.infoContainer, { backgroundColor: colors.surfaceLight, borderColor: colors.strokeExtraLight }]}>
						<Text style={[styles.coordsLine, { color: colors.fontTitlesLabels }]}>
							{liveLocationData.coords.latitude.toFixed(5)}, {liveLocationData.coords.longitude.toFixed(5)}
							{liveLocationData.coords.accuracy ? ` (±${Math.round(liveLocationData.coords.accuracy)}m)` : ''}
						</Text>
						<Text style={[styles.timestamp, { color: colors.fontSecondaryInfo }]}>
							{I18n.t('Last_updated_at')} {formatTimestamp(liveLocationData.lastUpdateAt)}
						</Text>
					</View>
				)}

				<TouchableOpacity onPress={openInMaps} disabled={!liveLocationData.coords}>
					<Text
						style={[
							styles.mapLinkText,
							{ color: colors.buttonBackgroundPrimaryDefault },
							!liveLocationData.coords && { color: colors.fontDisabled }
						]}>
						🗺️ {I18n.t('Open_in_provider', { provider: providerLabel(provider as MapProviderName) })}
					</Text>
				</TouchableOpacity>

				<View style={[styles.mapContainer, { shadowColor: colors.fontDefault, borderColor: colors.strokeExtraLight }]}>
					{mapImageUrl ? (
						<>
							<ExpoImage
								source={{ uri: mapImageUrl, headers: OSM_HEADERS, cacheKey }}
								style={styles.mapImage}
								contentFit='cover'
								transition={200}
								cachePolicy='disk'
								placeholder={BLURHASH_PLACEHOLDER}
								onError={(_e: ImageErrorEventData) => {
									setMapImageUrl('');
								}}
							/>
							<View style={styles.pinOverlay} pointerEvents='none'>
								<Text style={styles.pinText}>📍</Text>
							</View>
						</>
					) : (
						<View style={[styles.mapPlaceholder, { backgroundColor: colors.surfaceTint }]}>
							<Text
								style={[
									styles.loadingText,
									{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: colors.fontSecondaryInfo }
								]}>
								📍 {I18n.t('Map_Preview')}
							</Text>
							{liveLocationData.coords && (
								<Text style={[styles.loadingText, { fontSize: 14, marginBottom: 8, color: colors.fontSecondaryInfo }]}>
									{liveLocationData.coords.latitude.toFixed(5)}, {liveLocationData.coords.longitude.toFixed(5)}
								</Text>
							)}
							<Text
								style={[
									styles.loadingText,
									{ fontSize: 12, fontStyle: 'italic', textAlign: 'center', color: colors.fontSecondaryInfo }
								]}>
								{I18n.t('Map_preview_unavailable_open_below')}
							</Text>
						</View>
					)}
				</View>
				<Text style={[styles.attribution, { color: colors.fontSecondaryInfo }]}>{providerAttribution('osm')}</Text>

				{liveLocationData.isActive && (
					<Text style={[styles.liveIndicator, { color: colors.buttonBackgroundDangerDefault }]}>
						🔴 {I18n.t('Updates_every_10_seconds')}
					</Text>
				)}

				<View style={styles.buttons}>
					<TouchableOpacity
						onPress={handleClose}
						style={[
							styles.btn,
							{ borderColor: colors.strokeExtraLight, backgroundColor: colors.surfaceLight, shadowColor: colors.fontDefault }
						]}>
						<Text style={[styles.btnText, { color: colors.fontTitlesLabels }]}>{I18n.t('Close')}</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
};

export default LiveLocationViewerModal;
