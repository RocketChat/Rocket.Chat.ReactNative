import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking, InteractionManager } from 'react-native';
import { Image as ExpoImage, type ImageErrorEventData } from 'expo-image';
import * as Location from 'expo-location';
import { shallowEqual } from 'react-redux';

import I18n from '../../i18n';
import Navigation from '../../lib/navigation/appNavigation';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../selectors/login';
import { staticMapUrl, providerLabel, mapsDeepLink, providerAttribution } from './services/mapProviders';
import type { MapProviderName } from './services/mapProviders';
import { LiveLocationTracker } from './services/liveLocation';
import type { LiveLocationState } from './services/liveLocation';
import { 
	markLiveLocationAsEnded,
	isLiveLocationEnded,
	addLiveLocationEndedListener,
	removeLiveLocationEndedListener
} from './services/handleLiveLocationUrl';

type RouteParams = {
	rid: string;
	tmid?: string;
	provider: MapProviderName;
	liveLocationId?: string;
	ownerName?: string;
	isTracking?: boolean;
};

let globalTracker: LiveLocationTracker | null = null;
let globalTrackerParams: {
	rid?: string;
	tmid?: string;
	provider: MapProviderName;
	liveLocationId?: string;
	ownerName?: string;
	isTracking?: boolean;
	userId?: string;
	username?: string;
} | null = null;

const globalLocationUpdateCallbacks = new Set<(state: LiveLocationState) => void>();
const statusChangeListeners = new Set<(isActive: boolean) => void>();

let isModalMinimized = false;
const minimizedStatusListeners = new Set<(isMinimized: boolean) => void>();

export function getCurrentLiveParams() {
	return globalTrackerParams;
}
export function isLiveLocationMinimized(): boolean {
    return isModalMinimized && isLiveLocationActive();
}

export function addMinimizedStatusListener(listener: (isMinimized: boolean) => void) {
    minimizedStatusListeners.add(listener);
}

export function removeMinimizedStatusListener(listener: (isMinimized: boolean) => void) {
    minimizedStatusListeners.delete(listener);
}

function emitMinimizedStatusChange(minimized?: boolean) {
    const value = typeof minimized === 'boolean' ? minimized : isLiveLocationMinimized();
    minimizedStatusListeners.forEach(fn => {
        try {
            fn(value);
        } catch (e) {
            // Error in minimized status listener
        }
    });
}
export function addStatusChangeListener(listener: (isActive: boolean) => void) {
	statusChangeListeners.add(listener);
}
export function removeStatusChangeListener(listener: (isActive: boolean) => void) {
	statusChangeListeners.delete(listener);
}
function emitStatusChange(active?: boolean) {
	const value = typeof active === 'boolean' ? active : isLiveLocationActive();
	statusChangeListeners.forEach(fn => {
		try {
			fn(value);
		} catch (e) {
			// Error in live location listener
		}
	});
}

export default function LiveLocationPreviewModal({ route }: { route: { params: RouteParams } }) {
	const { rid, tmid, provider = 'google', liveLocationId, ownerName, isTracking = false } = route.params;
	const [submitting, setSubmitting] = useState(false);
	const [locationState, setLocationState] = useState<LiveLocationState | null>(null);
	const [mapImageUrl, setMapImageUrl] = useState<string>('');
	const [isShared, setIsShared] = useState(isTracking);
	const [currentOwnerName, setCurrentOwnerName] = useState<string | undefined>(ownerName);
	const trackerRef = useRef<LiveLocationTracker | null>(null);
	const viewerUpdateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		isModalMinimized = false;
		emitMinimizedStatusChange(false);
	}, []);

	const mounted = useRef(true);
	useEffect(
		() => () => {
			mounted.current = false;
			globalLocationUpdateCallbacks.delete(handleLocationUpdate);
			if (viewerUpdateIntervalRef.current) {
				clearInterval(viewerUpdateIntervalRef.current);
				viewerUpdateIntervalRef.current = null;
			}
		},
		[]
	);
	const safeSet = React.useCallback((fn: () => void) => {
		if (mounted.current) fn();
	}, []);

	useEffect(() => {
		if (mapImageUrl) {
			ExpoImage.prefetch(mapImageUrl).catch(() => {});
		}
	}, [mapImageUrl]);

	// OSM tile servers require a descriptive User-Agent and Referer per usage policy
	const OSM_HEADERS = useMemo(
		() => ({
			'User-Agent': 'RocketChatMobile/1.0 (+https://rocket.chat) contact: mobile@rocket.chat',
			Referer: 'https://rocket.chat'
		}),
		[]
	);

	const cacheKey = useMemo(() => {
		const lat = locationState?.coords?.latitude;
		const lon = locationState?.coords?.longitude;
		return lat && lon ? `osm-${lat.toFixed(5)}-${lon.toFixed(5)}-z15-v2` : undefined;
	}, [locationState?.coords?.latitude, locationState?.coords?.longitude]);

	const { id, username } = useAppSelector(getUserSelector, shallowEqual);
	
	const handleLocationUpdate = React.useCallback((state: LiveLocationState) => {
		
		safeSet(() => setLocationState(state));

		if (state.coords) {
			// Always use OSM tiles for preview (no keys)
			const { url } = staticMapUrl('osm', state.coords, { zoom: 15 });
			safeSet(() => setMapImageUrl(url));
		}

		emitStatusChange();
	}, [safeSet]);

	useEffect(() => {
		if (!isTracking && liveLocationId) {
			// If already ended, close immediately
			isLiveLocationEnded(liveLocationId).then(ended => {
				if (ended) {
					Navigation.back();
				} else {
					// Initialize with a temporary active state while viewing
					const activeState = {
						coords: {
							latitude: 37.78583,
							longitude: -122.40642,
							accuracy: 5
						},
						timestamp: Date.now(),
						isActive: true
					};
					handleLocationUpdate(activeState);
				}
			});

			const handleLiveLocationEnded = (endedLocationId: string) => {
				if (endedLocationId === liveLocationId) {
					// Owner stopped sharing while viewer is watching -> force close
					Navigation.back();
				}
			};

			addLiveLocationEndedListener(handleLiveLocationEnded);

			// Cleanup listener on unmount
			return () => {
				removeLiveLocationEndedListener(handleLiveLocationEnded);
			};
		}

		if (globalTracker && isTracking) {
			trackerRef.current = globalTracker;
			globalLocationUpdateCallbacks.add(handleLocationUpdate);

			const currentState = globalTracker.getCurrentState();
			if (currentState) handleLocationUpdate(currentState);
		} else if (isTracking) {
			const tracker = new LiveLocationTracker(
				rid,
				tmid,
				{ id, username },
				(state: LiveLocationState) => {
					globalLocationUpdateCallbacks.forEach(callback => {
						if (callback) callback(state);
					});
				}
			);

			trackerRef.current = tracker;
			globalLocationUpdateCallbacks.add(handleLocationUpdate);

			tracker.startTracking().catch(error => {
				// Failed to start live location
				Alert.alert(I18n.t('Error'), error.message || I18n.t('Could_not_get_location'));
			});
		} else {
			Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.High
			}).then((location: Location.LocationObject) => {
				const previewState: LiveLocationState = {
					coords: {
						latitude: location.coords.latitude,
						longitude: location.coords.longitude,
						accuracy: location.coords.accuracy ?? undefined
					},
					timestamp: Date.now(),
					isActive: false
				};
				handleLocationUpdate(previewState);
			}).catch((_error: any) => {
				const defaultState: LiveLocationState = {
					coords: {
						latitude: 37.78583,
						longitude: -122.40642,
						accuracy: 5
					},
					timestamp: Date.now(),
					isActive: false
				};
				handleLocationUpdate(defaultState);
			});
		}
	}, [isTracking, liveLocationId, handleLocationUpdate, id, rid, tmid, username]);

	const openInMaps = async () => {
		if (!locationState?.coords) return;
		try {
			const deep = await mapsDeepLink(provider, locationState.coords);
			await Linking.openURL(deep);
		} catch (error) {
			Alert.alert(I18n.t("error-open-maps-application"));
		}
	};

	const onCancel = () => {
		if (trackerRef.current) {
			trackerRef.current.stopTracking();
			globalTracker = null;
			globalTrackerParams = null;
			globalLocationUpdateCallbacks.clear();
			emitStatusChange(false);
		}
		Navigation.back();
	};

	const onShare = async () => {
		if (!locationState?.coords) {
			Alert.alert(I18n.t('Error'), I18n.t('Location_not_available'));
			return;
		}

		try {
			safeSet(() => setSubmitting(true));

			// If no tracker exists, create one and start tracking
			if (!trackerRef.current) {
				const tracker = new LiveLocationTracker(
					rid,
					tmid,
					{ id, username },
					(state: LiveLocationState) => {
						// Notify all registered callbacks (owner and viewers)
						globalLocationUpdateCallbacks.forEach(callback => {
							if (callback) callback(state);
						});
					}
				);

				trackerRef.current = tracker;
				globalLocationUpdateCallbacks.add(handleLocationUpdate);

				// Start tracking immediately when sharing
				await tracker.startTracking();
			}

			if (trackerRef.current) {
				const msgId = trackerRef.current.getMsgId();
				if (!msgId) {
					Alert.alert(I18n.t('Error'), 'Could not start live location. Please ensure your server has the liveLocation API routes and is reachable.');
					return;
				}

				globalTracker = trackerRef.current;
				globalTrackerParams = {
					rid,
					tmid,
					provider,
					liveLocationId: msgId, // Use tracker's message ID
					ownerName: username || 'You',
					isTracking: true,
					userId: id,
					username
				};
				emitStatusChange(true);
			}

			safeSet(() => {
				setIsShared(true);
				setCurrentOwnerName(username || 'You');
			});
		} catch (e: any) {
			Alert.alert(I18n.t('Oops'), e?.message || I18n.t('Could_not_send_message'));
		} finally {
			safeSet(() => setSubmitting(false));
		}
	};

	const onMinimize = () => {
		// Keep tracking; just remove this component's callback but keep status updates
		globalLocationUpdateCallbacks.delete(handleLocationUpdate);
		globalLocationUpdateCallbacks.add(() => emitStatusChange(true));
		
		// Set minimized state to show status bar
		isModalMinimized = true;
		emitMinimizedStatusChange(true);
		
		Navigation.back();
	};

	const onStopSharing = async () => {
		if (!isOwner()) {
			Navigation.back();
			return;
		}

		if (trackerRef.current) {
			const msgId = trackerRef.current.getMsgId();

			// stopTracking() now handles server communication
			try {
				await trackerRef.current.stopTracking();
			} catch (error) {
				// Failed to stop tracker
			}
			
			if (msgId) {
				try {
					await markLiveLocationAsEnded(msgId);
				} catch (e) {
					// Failed to mark live location as ended
				}
			}
			emitStatusChange(false);

			globalTracker = null;
			globalTrackerParams = null;
			globalLocationUpdateCallbacks.clear();
		}

		safeSet(() => setIsShared(false));
		Navigation.back();
	};

	const formatTimestamp = (timestamp: number) => {
		if (!timestamp || isNaN(timestamp)) {
			return 'Invalid Date';
		}
		return new Date(timestamp).toLocaleTimeString();
	};
	const isOwner = () => isTracking || (currentOwnerName && username ? currentOwnerName === username : Boolean(isShared));

	const renderActionButtons = () => {
		const shouldShowActiveButtons = (isShared || isTracking) || (!isTracking && liveLocationId);

		if (!shouldShowActiveButtons) {
			return (
				<>
					<TouchableOpacity onPress={onCancel} style={styles.btn}>
						<Text style={styles.btnText}>{I18n.t('Cancel')}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						disabled={submitting || !locationState?.coords}
						onPress={onShare}
						style={[styles.btn, styles.btnPrimary, !locationState?.coords && styles.btnDisabled]}>
						{submitting ? (
							<ActivityIndicator color='#fff' />
						) : (
							<Text style={[styles.btnText, styles.btnTextPrimary]}>{I18n.t('Start')}</Text>
						)}
					</TouchableOpacity>
				</>
			);
		}

		if (isOwner() && !(!isTracking && liveLocationId)) {
			return (
				<TouchableOpacity onPress={onStopSharing} style={[styles.btn, styles.btnDanger]}>
					<Text style={[styles.btnText, styles.btnTextDanger]}>{I18n.t('Stop_Sharing')}</Text>
				</TouchableOpacity>
			);
		}

		return (
			<TouchableOpacity onPress={() => Navigation.back()} style={[styles.btn]}>
				<Text style={[styles.btnText]}>{I18n.t('Close')}</Text>
			</TouchableOpacity>
		);
	};

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				{/* Header with minimize button */}
				<View style={styles.header}>
					<View style={styles.titleContainer}>
						<Text style={styles.title}>📍 {I18n.t('Live_Location')}</Text>
						{currentOwnerName && <Text style={styles.ownerName}>{I18n.t('Shared_By')} {currentOwnerName}</Text>}
					</View>
					{(isShared || isTracking) && isOwner() && (
						<TouchableOpacity onPress={onMinimize} style={styles.minimizeButton} activeOpacity={0.7}>
							<View style={styles.minimizeIcon}>
								<View style={styles.minimizeLine} />
							</View>
						</TouchableOpacity>
					)}
				</View>

				{/* Status indicator */}
				<View style={styles.statusContainer}>
					<View
						style={[
							styles.statusDot,
							{ backgroundColor: ((isShared || isTracking) || (!isTracking && liveLocationId)) && locationState?.isActive ? '#27ae60' : '#e74c3c' }
						]}
					/>
					<Text style={styles.statusText}>
						{((isShared || isTracking) || (!isTracking && liveLocationId)) && locationState?.isActive ? I18n.t('Live_Location_Active') : I18n.t('Live_Location_Inactive')}
					</Text>
				</View>

				{/* Coordinates and timestamp */}
				{locationState?.coords && (
					<View style={styles.infoContainer}>
						<Text style={styles.coordsLine}>
							{locationState.coords.latitude.toFixed(5)}, {locationState.coords.longitude.toFixed(5)}
							{locationState.coords.accuracy ? ` (±${Math.round(locationState.coords.accuracy)}m)` : ''}
						</Text>
						<Text style={styles.timestamp}>{I18n.t('Last_updated_at')} {formatTimestamp(locationState.timestamp)}</Text>
					</View>
				)}

				{/* Clickable link to open in maps */}
				<TouchableOpacity onPress={openInMaps} disabled={!locationState?.coords}>
					<Text style={[styles.mapLinkText, !locationState?.coords && styles.disabledLink]}>
						🗺️ Open in {providerLabel(provider)}
					</Text>
				</TouchableOpacity>

				{/* Map image (expo-image) */}
				<View style={styles.mapContainer}>
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
								// Map image failed to load, clear URL to show fallback
								safeSet(() => setMapImageUrl(''));
							}}
						/>
						{/* Center pin overlay */}
						<View style={styles.pinOverlay} pointerEvents='none'>
							<Text style={styles.pinText}>📍</Text>
						</View>
						</>
					) : (
						<View style={styles.mapPlaceholder}>
							<Text style={[styles.loadingText, { fontSize: 16, fontWeight: 'bold', marginBottom: 8 }]}>📍 {I18n.t('Map_Preview')}</Text>
							{locationState?.coords && (
								<Text style={[styles.loadingText, { fontSize: 14, marginBottom: 8 }]}>
									{locationState.coords.latitude.toFixed(5)}, {locationState.coords.longitude.toFixed(5)}
								</Text>
							)}
							<Text style={[styles.loadingText, { fontSize: 12, fontStyle: 'italic', textAlign: 'center' }] }>
								Map preview unavailable{'\n'}Tap "Open in Maps" below to view location
							</Text>
						</View>
					)}
				</View>

				{/* OSM attribution (required) */}
				<Text style={styles.attribution}>{providerAttribution('osm')}</Text>

				{((isShared || isTracking) || (!isTracking && liveLocationId)) && <Text style={styles.liveIndicator}>🔴 {I18n.t('Updates_every_10_seconds')}</Text>}

				{/* Buttons */}
				<View style={styles.buttons}>
					{renderActionButtons()}
				</View>
			</View>
		</View>
	);
}

export function isLiveLocationActive(): boolean {
	return globalTracker !== null && globalTracker.getCurrentState()?.isActive === true;
}

export function reopenLiveLocationModal() {
	if (!globalTracker || !globalTrackerParams) return;
	
	// Clear minimized state when reopening modal
	isModalMinimized = false;
	emitMinimizedStatusChange(false);
	
	InteractionManager.runAfterInteractions(() => {
		Navigation.navigate('LiveLocationPreviewModal', {
			...globalTrackerParams,
			isTracking: true
		});
	});
}

export async function stopGlobalLiveLocation() {
	if (!globalTracker) {
		emitStatusChange(false);
		return;
	}

	const params = globalTrackerParams;
	try {
		await globalTracker.stopTracking();

		if (params?.liveLocationId) {
			try {
				await markLiveLocationAsEnded(params.liveLocationId);
			} catch {
				// Failed to mark live location as ended
			}
		}

		// No need to send manual stop message - server handles this via LiveLocationApi.stop
		if (params?.liveLocationId) {
			try {
				await markLiveLocationAsEnded(params.liveLocationId);
			} catch (e) {
				// best-effort cleanup
			}
		}
	} finally {
		globalTracker = null;
		globalTrackerParams = null;
		globalLocationUpdateCallbacks.clear();
		
		// Clear minimized state when stopping
		isModalMinimized = false;
		emitMinimizedStatusChange(false);
		emitStatusChange(false);
	}
}

const BLURHASH_PLACEHOLDER = 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH';

const styles = StyleSheet.create({
	container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#ecf0f1' },
	content: {
		backgroundColor: '#ffffff',
		borderRadius: 16,
		padding: 20,
		shadowColor: '#000',
		shadowOpacity: 0.15,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 6 },
		elevation: 8,
		borderWidth: 1,
		borderColor: '#e9ecef'
	},
	header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 },
	titleContainer: { flex: 1, alignItems: 'center' },
	title: { fontSize: 20, fontWeight: '700', textAlign: 'center', color: '#2c3e50' },
	ownerName: { fontSize: 14, color: '#7f8c8d', marginTop: 4, fontWeight: '500' },
	minimizeButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#f8f9fa',
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		borderWidth: 1,
		borderColor: '#e9ecef'
	},
	minimizeIcon: { width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
	minimizeLine: { width: 14, height: 2, backgroundColor: '#6c757d', borderRadius: 1 },
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
	statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
	statusText: { fontSize: 14, fontWeight: '600', color: '#495057' },
	infoContainer: {
		marginBottom: 20,
		alignItems: 'center',
		backgroundColor: '#ffffff',
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#e9ecef'
	},
	coordsLine: { fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 6, color: '#2c3e50' },
	timestamp: { fontSize: 12, color: '#6c757d', textAlign: 'center', fontWeight: '500' },
	mapLinkText: { color: '#3498db', fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 16, paddingVertical: 8 },
	disabledLink: { color: '#ccc' },
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
	mapImage: { width: '100%', height: 220 },
	mapPlaceholder: { width: '100%', height: 220, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center' },
	loadingText: { marginTop: 12, fontSize: 14, color: '#6c757d', fontWeight: '500' },
	attribution: { fontSize: 10, color: '#6c757d', textAlign: 'center', marginBottom: 12 },
	pinOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
	pinText: { fontSize: 24 },
	liveIndicator: {
		fontSize: 13,
		color: '#e74c3c',
		textAlign: 'center',
		marginBottom: 20,
		fontStyle: 'italic',
		fontWeight: '600'
	},

	buttons: { flexDirection: 'row', gap: 16, marginTop: 8 },
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
	btnPrimary: { backgroundColor: '#3498db', borderColor: '#3498db' },
	btnDanger: { backgroundColor: '#e74c3c', borderColor: '#e74c3c' },
	btnDisabled: { backgroundColor: '#ecf0f1', borderColor: '#bdc3c7' },
	btnText: { fontWeight: '700', fontSize: 16, color: '#2c3e50' },
	btnTextPrimary: { color: '#ffffff' },
	btnTextDanger: { color: '#ffffff' }
});