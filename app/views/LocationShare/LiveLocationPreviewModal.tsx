import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking, InteractionManager } from 'react-native';
import { Image as ExpoImage, type ImageErrorEventData } from 'expo-image';
import I18n from '../../i18n';

import Navigation from '../../lib/navigation/appNavigation';
import { sendMessage } from '../../lib/methods/sendMessage';
import { staticMapUrl, MapProviderName, providerLabel, mapsDeepLink } from './services/mapProviders';
import {
	LiveLocationTracker,
	LiveLocationState,
	generateLiveLocationId,
	createLiveLocationMessage,
	createLiveLocationStopMessage
} from './services/liveLocation';
import { markLiveLocationAsEnded } from './services/handleLiveLocationUrl';
import { useAppSelector } from '../../lib/hooks';
import { getUserSelector } from '../../selectors/login';
import { shallowEqual } from 'react-redux';

type RouteParams = {
	rid: string;
	tmid?: string;
	provider: MapProviderName;
	googleKey?: string;
	osmKey?: string;
	liveLocationId?: string;
	ownerName?: string;
	isTracking?: boolean;
};

// Global tracker instance to keep it running when minimized
let globalTracker: LiveLocationTracker | null = null;
let globalTrackerParams: {
	rid?: string;
	tmid?: string;
	provider: MapProviderName;
	googleKey?: string;
	osmKey?: string;
	liveLocationId?: string;
	ownerName?: string;
	isTracking?: boolean;
	userId?: string;
	username?: string;
} | null = null;

let globalLocationUpdateCallback: ((state: LiveLocationState) => void) | null = null;

// Simple callback system for live location status
const statusChangeListeners = new Set<(isActive: boolean) => void>();

export function getCurrentLiveParams() {
	return globalTrackerParams;
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
	const { rid, tmid, provider, googleKey, osmKey, liveLocationId, ownerName, isTracking = false } = route.params;
	const [submitting, setSubmitting] = useState(false);
	const [locationState, setLocationState] = useState<LiveLocationState | null>(null);
	const [mapImageUrl, setMapImageUrl] = useState<string>('');
	const [isShared, setIsShared] = useState(isTracking);
	const [currentOwnerName, setCurrentOwnerName] = useState<string | undefined>(ownerName);
	const trackerRef = useRef<LiveLocationTracker | null>(null);

	// Guard against state updates after unmount
	const mounted = useRef(true);
	useEffect(
		() => () => {
			mounted.current = false;
			if (globalLocationUpdateCallback === handleLocationUpdate) {
				globalLocationUpdateCallback = null;
			}
		},
		[]
	);
	const safeSet = (fn: () => void) => {
		if (mounted.current) fn();
	};

	useEffect(() => {
		if (mapImageUrl) {
			ExpoImage.prefetch(mapImageUrl).catch(() => {});
		}
	}, [mapImageUrl]);

	const serverUrl = useAppSelector(state => state.server.server);
	const { id, username } = useAppSelector(
		state => ({
			id: getUserSelector(state).id,
			username: getUserSelector(state).username
		}),
		shallowEqual
	);

	const handleLocationUpdate = (state: LiveLocationState) => {
		safeSet(() => setLocationState(state));

		if (state.coords) {
			const opts: { size: `${number}x${number}`; zoom: number; googleApiKey?: string; osmApiKey?: string } = {
				size: '640x320',
				zoom: 15
			};
			if (provider === 'google' && googleKey) opts.googleApiKey = googleKey;
			if (provider === 'osm' && osmKey) opts.osmApiKey = osmKey;

			const { url } = staticMapUrl(provider, state.coords, opts);
			safeSet(() => setMapImageUrl(url));
		}

		emitStatusChange();
	};

	useEffect(() => {
		if (globalTracker && isTracking) {
			// Reuse existing tracker
			trackerRef.current = globalTracker;
			globalLocationUpdateCallback = handleLocationUpdate;

			const currentState = globalTracker.getCurrentState();
			if (currentState) handleLocationUpdate(currentState);
		} else {
			const tracker = new LiveLocationTracker((state: LiveLocationState) => {
				handleLocationUpdate(state);
				if (globalLocationUpdateCallback && globalLocationUpdateCallback !== handleLocationUpdate) {
					globalLocationUpdateCallback(state);
				}
			});

			trackerRef.current = tracker;
			globalLocationUpdateCallback = handleLocationUpdate;

			tracker.startTracking().catch(error => {
				// Failed to start live location
				Alert.alert(I18n.t('Error'), error.message || I18n.t('Could_not_get_location'));
			});
		}
	}, [provider, googleKey, osmKey, isTracking]);

	const openInMaps = async () => {
		if (!locationState?.coords) return;
		try {
			const deep = await mapsDeepLink(provider, locationState.coords);
			await Linking.openURL(deep);
		} catch (error) {
			Alert.alert('Error', 'Could not open maps application');
		}
	};

	const onCancel = () => {
		if (trackerRef.current) {
			trackerRef.current.stopTracking();
			globalTracker = null;
			globalTrackerParams = null;
			globalLocationUpdateCallback = null;
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

			const currentLiveLocationId = liveLocationId || generateLiveLocationId();
			const message = createLiveLocationMessage(currentLiveLocationId, provider, locationState.coords, serverUrl, rid, tmid);
			await sendMessage(rid, message, tmid, { id, username }, false);

			if (trackerRef.current) {
				globalTracker = trackerRef.current;
				globalTrackerParams = {
					rid,
					tmid,
					provider,
					googleKey,
					osmKey,
					liveLocationId: currentLiveLocationId,
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
		// Keep tracking; just drop our state-updating callback
		globalLocationUpdateCallback = () => emitStatusChange(true);
		Navigation.back();
	};

	const onStopSharing = async () => {
		if (!isOwner()) {
			Navigation.back();
			return;
		}

		if (trackerRef.current) {
			const currentState = trackerRef.current.getCurrentState();
			const idToStop = liveLocationId ?? (globalTrackerParams && globalTrackerParams.liveLocationId) ?? null;

			trackerRef.current.stopTracking();
			if (idToStop) {
				try {
					await markLiveLocationAsEnded(idToStop);
				} catch (e) {
					// best-effort; ignore but keep ESLint happy
					void e;
				}
			}
			emitStatusChange(false);

			if (idToStop && currentState?.coords) {
				try {
					const stopMessage = createLiveLocationStopMessage(idToStop, provider, currentState.coords);
					await sendMessage(rid, stopMessage, tmid, { id, username }, false);
				} catch (error) {
					// Failed to send stop message
				}
			}

			globalTracker = null;
			globalTrackerParams = null;
			globalLocationUpdateCallback = null;
		}

		safeSet(() => setIsShared(false));
		Navigation.back();
	};

	const formatTimestamp = (timestamp: number) => new Date(timestamp).toLocaleTimeString();
	const isOwner = () => isTracking || (currentOwnerName && username ? currentOwnerName === username : Boolean(isShared));

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				{/* Header with minimize button */}
				<View style={styles.header}>
					<View style={styles.titleContainer}>
						<Text style={styles.title}>📍 Live Location</Text>
						{currentOwnerName && <Text style={styles.ownerName}>Shared by {currentOwnerName}</Text>}
					</View>
					{(isShared || isTracking) && (
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
							{ backgroundColor: (isShared || isTracking) && locationState?.isActive ? '#27ae60' : '#e74c3c' }
						]}
					/>
					<Text style={styles.statusText}>
						{(isShared || isTracking) && locationState?.isActive ? 'Live Location Active' : 'Live Location Inactive'}
					</Text>
				</View>

				{/* Coordinates and timestamp */}
				{locationState?.coords && (
					<View style={styles.infoContainer}>
						<Text style={styles.coordsLine}>
							{locationState.coords.latitude.toFixed(5)}, {locationState.coords.longitude.toFixed(5)}
							{locationState.coords.accuracy ? ` (±${Math.round(locationState.coords.accuracy)}m)` : ''}
						</Text>
						<Text style={styles.timestamp}>Last updated: {formatTimestamp(locationState.timestamp)}</Text>
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
						<ExpoImage
							source={{ uri: mapImageUrl }}
							style={styles.mapImage}
							contentFit='cover'
							transition={200}
							cachePolicy='disk'
							placeholder={BLURHASH_PLACEHOLDER}
							onError={(_e: ImageErrorEventData) => {
								// Map image failed to load
							}}
						/>
					) : (
						<View style={styles.mapPlaceholder}>
							<ActivityIndicator size='large' />
							<Text style={styles.loadingText}>Loading live location...</Text>
						</View>
					)}
				</View>

				{(isShared || isTracking) && <Text style={styles.liveIndicator}>🔴 Updates every 10 seconds</Text>}

				{/* Buttons */}
				<View style={styles.buttons}>
					{isShared || isTracking ? (
						<TouchableOpacity onPress={onStopSharing} style={[styles.btn, styles.btnDanger]}>
							<Text style={[styles.btnText, styles.btnTextDanger]}>{isOwner() ? 'Stop Sharing' : 'Stop Viewing'}</Text>
						</TouchableOpacity>
					) : (
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
									<Text style={[styles.btnText, styles.btnTextPrimary]}>Start</Text>
								)}
							</TouchableOpacity>
						</>
					)}
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
		const state = globalTracker.getCurrentState();
		globalTracker.stopTracking();

		if (params?.liveLocationId) {
			try {
				await markLiveLocationAsEnded(params.liveLocationId);
			} catch {}
		}

		if (params?.rid && params.liveLocationId && params.userId && params.username) {
			try {
				const stopMsg = createLiveLocationStopMessage(
					params.liveLocationId,
					params.provider,
					state?.coords || { latitude: 0, longitude: 0 }
				);
				await sendMessage(params.rid, stopMsg, params.tmid, { id: params.userId, username: params.username }, false);
			} catch (e) {
				// Failed to send stop message
			}
		}
	} finally {
		globalTracker = null;
		globalTrackerParams = null;
		globalLocationUpdateCallback = null;
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
