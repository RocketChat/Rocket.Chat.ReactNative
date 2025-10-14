import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, TouchableOpacity, Linking } from 'react-native';
import { Image as ExpoImage, type ImageErrorEventData } from 'expo-image';

import I18n from '../../i18n';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import Navigation from '../../lib/navigation/appNavigation';
import { LiveLocationApi, serverToMobileCoords } from './services/liveLocationApi';
import { staticMapUrl, MapProviderName, providerLabel, mapsDeepLink } from './services/mapProviders';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { useUserPreferences } from '../../lib/methods/userPreferences';
import {
	MAP_PROVIDER_PREFERENCE_KEY,
	GOOGLE_MAPS_API_KEY_PREFERENCE_KEY,
	OSM_API_KEY_PREFERENCE_KEY,
	MAP_PROVIDER_DEFAULT
} from '../../lib/constants/keys';

export interface LiveLocationViewerModalProps {
	navigation: any;
	route: {
		params: {
			rid: string;
			msgId: string;
			provider?: 'osm' | 'google';
			googleKey?: string;
			osmKey?: string;
		};
	};
}

interface LiveLocationData {
	messageId: string;
	ownerId: string;
	ownerUsername: string;
	ownerName: string;
	isActive: boolean;
	startedAt?: number;      // allow undefined if server doesn’t send
	lastUpdateAt?: number;   // allow undefined if server doesn’t send
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

const LiveLocationViewerModal = ({ route }: LiveLocationViewerModalProps): React.ReactElement => {
	const { rid, msgId, provider: routeProvider } = route.params;
	const [loading, setLoading] = useState(true);
	const [liveLocationData, setLiveLocationData] = useState<LiveLocationData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [mapImageUrl, setMapImageUrl] = useState<string>('');
	const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const previousActiveState = useRef<boolean | null>(null);

	const currentUserId = useAppSelector(state => state.login.user.id);
	const [viewerMapProvider] = useUserPreferences<MapProviderName>(`${MAP_PROVIDER_PREFERENCE_KEY}_${currentUserId}`, MAP_PROVIDER_DEFAULT);
	const [viewerGoogleApiKey] = useUserPreferences<string>(`${GOOGLE_MAPS_API_KEY_PREFERENCE_KEY}_${currentUserId}`, '');
	const [viewerOsmApiKey] = useUserPreferences<string>(`${OSM_API_KEY_PREFERENCE_KEY}_${currentUserId}`, '');

	const provider = viewerMapProvider || routeProvider || 'osm';
	const googleKey = viewerGoogleApiKey;
	const osmKey = viewerOsmApiKey;

	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: '#ffffff',
			justifyContent: 'center',
			alignItems: 'center',
			paddingHorizontal: 20
		},
		content: {
			width: '100%',
			maxWidth: 400,
			backgroundColor: '#ffffff',
			borderRadius: 20,
			padding: 24,
			shadowColor: '#000',
			shadowOpacity: 0.15,
			shadowRadius: 12,
			shadowOffset: { width: 0, height: 6 },
			elevation: 8,
			borderWidth: 1,
			borderColor: '#e9ecef'
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
			textAlign: 'center',
			color: '#2c3e50'
		},
		ownerName: {
			fontSize: 14,
			color: '#7f8c8d',
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
			backgroundColor: '#f8f9fa',
			borderRadius: 20,
			borderWidth: 1,
			borderColor: '#e9ecef'
		},
		statusDot: {
			width: 8,
			height: 8,
			borderRadius: 4,
			marginRight: 8
		},
		statusText: {
			fontSize: 14,
			fontWeight: '600',
			color: '#495057'
		},
		infoContainer: {
			marginBottom: 20,
			alignItems: 'center',
			backgroundColor: '#ffffff',
			padding: 16,
			borderRadius: 12,
			borderWidth: 1,
			borderColor: '#e9ecef'
		},
		coordsLine: {
			fontSize: 15,
			fontWeight: '600',
			textAlign: 'center',
			marginBottom: 6,
			color: '#2c3e50'
		},
		timestamp: {
			fontSize: 12,
			color: '#6c757d',
			textAlign: 'center',
			fontWeight: '500'
		},
		mapLinkText: {
			color: '#3498db',
			fontSize: 16,
			fontWeight: '700',
			textAlign: 'center',
			marginBottom: 16,
			paddingVertical: 8
		},
		disabledLink: {
			color: '#ccc'
		},
		mapContainer: {
			borderRadius: 12,
			overflow: 'hidden',
			marginBottom: 16,
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.1,
			shadowRadius: 8,
			elevation: 4,
			borderWidth: 1,
			borderColor: '#e9ecef'
		},
		mapImage: {
			width: '100%',
			height: 220
		},
		mapPlaceholder: {
			width: '100%',
			height: 220,
			backgroundColor: '#f8f9fa',
			justifyContent: 'center',
			alignItems: 'center'
		},
		loadingText: {
			marginTop: 12,
			fontSize: 14,
			color: '#6c757d',
			fontWeight: '500'
		},
		liveIndicator: {
			fontSize: 13,
			color: '#e74c3c',
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
			borderColor: '#e9ecef',
			backgroundColor: '#ffffff',
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.05,
			shadowRadius: 4,
			elevation: 2
		},
		btnText: {
			fontWeight: '700',
			fontSize: 16,
			color: '#2c3e50'
		},
		errorText: {
			fontSize: 16,
			color: '#e74c3c',
			textAlign: 'center',
			marginBottom: 16
		}
	});

	const convertTimestamp = (value: any): number | undefined => {
		if (value && typeof value === 'object') {
			if (typeof value.date === 'number') return value.date;
			if (typeof (value as any).$date === 'number') return (value as any).$date;
			if (typeof (value as any).seconds === 'number') return (value as any).seconds * 1000;
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

			const lastUpdateAt =
				convertTimestamp(response.lastUpdateAt) ??
				convertTimestamp((response as any).ownerLastUpdateAt) ??
				convertTimestamp((response as any).updatedAt);

			const startedAt =
				convertTimestamp(response.startedAt) ??
				convertTimestamp((response as any).ownerStartedAt);

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

			// Generate map image URL using viewer's own API keys
			if (mobileCoords) {
				let mapUrl = '';
				try {
					if (provider === 'google' && googleKey) {

						const mapResult = staticMapUrl('google', mobileCoords, {
							size: '350x220',
							googleApiKey: googleKey
						});
						mapUrl = mapResult.url;
					} else if (provider === 'osm' && osmKey) {

						const mapResult = staticMapUrl('osm', mobileCoords, {
							size: '350x220',
							osmApiKey: osmKey
						});
						mapUrl = mapResult.url;
					} else {
						const mapResult = staticMapUrl('google', mobileCoords, {
							size: '350x220'
						});
						mapUrl = mapResult.url;
					}
				} catch (error) {

					mapUrl = '';
				}

				setMapImageUrl(mapUrl);
			}
		} catch (err: any) {

			setError(err.message || 'Failed to load live location');
		} finally {
			setLoading(false);
		}
	}, [rid, msgId, provider, googleKey, osmKey]);

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

	const openInMaps = async () => {
		if (!liveLocationData?.coords) return;

		try {
			const mapUrl = await mapsDeepLink(provider as MapProviderName, liveLocationData.coords);
			if (mapUrl) {
				await Linking.openURL(mapUrl);
			}
		} catch (err) {

			Alert.alert(I18n.t('Error'), 'Could not open maps application');
		}
	};

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
					Alert.alert(
						'Live Location Ended',
						`${liveLocationData.ownerName || liveLocationData.ownerUsername} has stopped sharing their location.`,
						[
							{
								text: 'OK',
								onPress: () => {
									Navigation.back();
								}
							}
						],
						{ cancelable: false }
					);
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
			<SafeAreaView style={styles.container}>
				<StatusBar />
				<View style={styles.content}>
					<ActivityIndicator size='large' color='#3498db' />
					<Text style={styles.loadingText}>
						Loading live location...
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (error || !liveLocationData) {
		return (
			<SafeAreaView style={styles.container}>
				<StatusBar />
				<View style={styles.content}>
					<Text style={styles.errorText}>
						{error || 'Live location not found'}
					</Text>
					<TouchableOpacity onPress={handleClose} style={[styles.btn]}>
						<Text style={styles.btnText}>Close</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				{/* Header - NO minimize button for other users */}
				<View style={styles.header}>
					<View style={styles.titleContainer}>
						<Text style={styles.title}>📍 Live Location</Text>
						<Text style={styles.ownerName}>Shared by {liveLocationData.ownerUsername}</Text>
					</View>
					{/* No minimize button for other users */}
				</View>

				{/* Status indicator */}
				<View style={styles.statusContainer}>
					<View
						style={[
							styles.statusDot,
							{ backgroundColor: liveLocationData.isActive ? '#27ae60' : '#e74c3c' }
						]}
					/>
					<Text style={styles.statusText}>
						{liveLocationData.isActive ? 'Live Location Active' : 'Live Location Inactive'}
					</Text>
				</View>

				{/* Coordinates and timestamp */}
				{liveLocationData.coords && (
					<View style={styles.infoContainer}>
						<Text style={styles.coordsLine}>
							{liveLocationData.coords.latitude.toFixed(5)}, {liveLocationData.coords.longitude.toFixed(5)}
							{liveLocationData.coords.accuracy ? ` (±${Math.round(liveLocationData.coords.accuracy)}m)` : ''}
						</Text>
						<Text style={styles.timestamp}>
							Last updated: {formatTimestamp(liveLocationData.lastUpdateAt)}
						</Text>
					</View>
				)}

				{/* Clickable link to open in maps */}
				<TouchableOpacity onPress={openInMaps} disabled={!liveLocationData.coords}>
					<Text style={[styles.mapLinkText, !liveLocationData.coords && styles.disabledLink]}>
						🗺️ Open in {providerLabel(provider as MapProviderName)}
					</Text>
				</TouchableOpacity>

				{/* Map image */}
				<View style={styles.mapContainer}>
					{mapImageUrl ? (
						<ExpoImage
							source={{ uri: mapImageUrl }}
							style={styles.mapImage}
							contentFit='cover'
							transition={200}
							cachePolicy='disk'
							placeholder={BLURHASH_PLACEHOLDER}
							onError={(_e: ImageErrorEventData) => {
								// Map image failed to load, clear URL to show fallback
								setMapImageUrl('');
							}}
						/>
					) : (
						<View style={styles.mapPlaceholder}>
							<Text style={[styles.loadingText, { fontSize: 16, fontWeight: 'bold', marginBottom: 8 }]}>📍 Map Preview</Text>
							{liveLocationData.coords && (
								<Text style={[styles.loadingText, { fontSize: 14, marginBottom: 8 }]}>
									{liveLocationData.coords.latitude.toFixed(5)}, {liveLocationData.coords.longitude.toFixed(5)}
								</Text>
							)}
							<Text style={[styles.loadingText, { fontSize: 12, fontStyle: 'italic', textAlign: 'center' }]}>
								Map preview unavailable{'\n'}Tap "Open in Maps" below to view location
							</Text>
						</View>
					)}
				</View>

				{/* Live indicator */}
				{liveLocationData.isActive && <Text style={styles.liveIndicator}>🔴 Updates every 10 seconds</Text>}

				{/* Buttons - ONLY Close button for other users */}
				<View style={styles.buttons}>
					<TouchableOpacity onPress={handleClose} style={styles.btn}>
						<Text style={styles.btnText}>Close</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
};

export default LiveLocationViewerModal;
