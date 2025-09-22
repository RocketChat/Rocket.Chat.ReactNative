import React, { useState, useEffect, useRef } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking } from 'react-native';
import I18n from '../../i18n';
import Navigation from '../../lib/navigation/appNavigation';

import { sendMessage } from '../../lib/methods/sendMessage';
import { staticMapUrl, MapProviderName, providerLabel, mapsDeepLink } from './services/mapProviders';
import {
	LiveLocationTracker,
	LiveLocationState,
	generateLiveLocationId,
	createLiveLocationMessage
} from './services/liveLocation';
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
let globalTrackerParams: any = null;
let globalLocationUpdateCallback: ((state: LiveLocationState) => void) | null = null;

// Simple callback system for live location status
let statusChangeListeners: ((isActive: boolean) => void)[] = [];

export function getCurrentLiveParams() {
	return globalTrackerParams;
}
// Helper functions for managing listeners
export function addStatusChangeListener(listener: (isActive: boolean) => void) {
	statusChangeListeners.push(listener);
}

export function removeStatusChangeListener(listener: (isActive: boolean) => void) {
	statusChangeListeners = statusChangeListeners.filter(l => l !== listener);
}

function emitStatusChange() {
	const isActive = isLiveLocationActive();
	statusChangeListeners.forEach(listener => {
		try {
			listener(isActive);
		} catch (error) {
			console.error('Error in live location status listener:', error);
		}
	});
}

export default function LiveLocationPreviewModal({ route }: { route: { params: RouteParams } }) {
	const { rid, tmid, provider, googleKey, osmKey, liveLocationId, ownerName, isTracking = false } = route.params;
	const [submitting, setSubmitting] = useState(false);
	const [locationState, setLocationState] = useState<LiveLocationState | null>(null);
	const [mapImageUrl, setMapImageUrl] = useState<string>('');
	const [isShared, setIsShared] = useState(isTracking);
	const trackerRef = useRef<LiveLocationTracker | null>(null);

	const serverUrl = useAppSelector(state => state.server.server);

	// Create a location update handler that works both when modal is open and minimized
	const handleLocationUpdate = (state: LiveLocationState) => {
		console.log('[LiveLocationPreviewModal] Location update received:', state);
		setLocationState(state);

		if (state.coords) {
			const opts: any = { size: '640x320', zoom: 15 };
			if (provider === 'google' && googleKey) opts.googleApiKey = googleKey;
			if (provider === 'osm' && osmKey) opts.osmApiKey = osmKey;

			const { url } = staticMapUrl(provider, state.coords, opts);
			setMapImageUrl(url);
		}

		// Always emit status change for other components
		emitStatusChange();
	};

	useEffect(() => {
		// Check if there's already a global tracker running
		if (globalTracker && isTracking) {
			// Reuse existing tracker
			trackerRef.current = globalTracker;

			// Set up our local callback
			globalLocationUpdateCallback = handleLocationUpdate;

			const currentState = globalTracker.getCurrentState();
			if (currentState) {
				handleLocationUpdate(currentState);
			}
		} else {
			// Create new tracker with global callback support
			const tracker = new LiveLocationTracker((state: LiveLocationState) => {
				// Call local callback if modal is open
				handleLocationUpdate(state);

				// Also call global callback if it exists (for when minimized)
				if (globalLocationUpdateCallback && globalLocationUpdateCallback !== handleLocationUpdate) {
					globalLocationUpdateCallback(state);
				}
			});

			trackerRef.current = tracker;
			globalLocationUpdateCallback = handleLocationUpdate;

			tracker.startTracking().catch(error => {
				console.error('Failed to start live location:', error);
				Alert.alert(I18n.t('Error'), error.message || I18n.t('Could_not_get_location'));
			});
		}

		return () => {
			// Don't clear global callback when component unmounts if minimized
			// Only clear when explicitly stopped
		};
	}, [provider, googleKey, osmKey, isTracking]);

	const openInMaps = async () => {
		if (!locationState?.coords) return;

		try {
			const deep = await mapsDeepLink(provider, locationState.coords);
			await Linking.openURL(deep);
		} catch (error) {
			console.error('Failed to open maps:', error);
			Alert.alert('Error', 'Could not open maps application');
		}
	};

	const onCancel = () => {
		if (trackerRef.current) {
			trackerRef.current.stopTracking();
			globalTracker = null;
			globalTrackerParams = null;
			globalLocationUpdateCallback = null;
			emitStatusChange();
		}
		Navigation.back();
	};

	const onShare = async () => {
		if (!locationState?.coords) {
			Alert.alert(I18n.t('Error'), I18n.t('Location_not_available'));
			return;
		}

		try {
			setSubmitting(true);

			const currentLiveLocationId = liveLocationId || generateLiveLocationId();
			const message = createLiveLocationMessage(currentLiveLocationId, provider, locationState.coords, serverUrl, rid, tmid);

			const { id, token, username } = useAppSelector(
				state => ({
					id: getUserSelector(state).id,
					token: getUserSelector(state).token,
					username: getUserSelector(state).username
				}),
				shallowEqual
			);

			await sendMessage(rid, message, tmid, { id, username }, false);

			// Store tracker globally and params for later access
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
					isTracking: true
				};

				// Emit status change
				emitStatusChange();
			}

			setIsShared(true);
		} catch (e: any) {
			console.error('[LiveLocationPreview] Error sending message:', e);
			Alert.alert(I18n.t('Oops'), e?.message || I18n.t('Could_not_send_message'));
		} finally {
			setSubmitting(false);
		}
	};

	const onMinimize = () => {
		// Keep the tracker running in the background with global callback
		console.log('[LiveLocationPreview] Minimizing - tracker continues running');

		// Set up a minimal global callback for status updates
		globalLocationUpdateCallback = (state: LiveLocationState) => {
			console.log('[Background] Location update received:', state);
			emitStatusChange();
		};

		Navigation.back();
	};

	const onStopSharing = () => {
		if (trackerRef.current) {
			trackerRef.current.stopTracking();
			globalTracker = null;
			globalTrackerParams = null;
			globalLocationUpdateCallback = null;
			emitStatusChange();
		}
		Navigation.back();
	};

	const formatTimestamp = (timestamp: number) => {
		return new Date(timestamp).toLocaleTimeString();
	};

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				{/* Header with minimize button */}
				<View style={styles.header}>
					<Text style={styles.title}>{isShared || isTracking ? '📍 Live Location' : '🧪 Live Location Preview'}</Text>
					{ownerName && <Text style={styles.ownerName}>Shared by {ownerName}</Text>}
					{/* Minimize button - only show when sharing */}
					{(isShared || isTracking) && (
						<TouchableOpacity onPress={onMinimize} style={styles.minimizeButton}>
							<Text style={styles.minimizeText}>➖ Minimize</Text>
						</TouchableOpacity>
					)}
				</View>

				{/* Status indicator */}
				<View style={styles.statusContainer}>
					<View style={[styles.statusDot, { backgroundColor: locationState?.isActive ? '#4CAF50' : '#FF5722' }]} />
					<Text style={styles.statusText}>
						{locationState?.isActive
							? isShared || isTracking
								? 'Live Location Active'
								: 'Test Mode Active'
							: 'Location Inactive'}
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

				{/* Map image */}
				<View style={styles.mapContainer}>
					{mapImageUrl ? (
						<Image
							source={{ uri: mapImageUrl }}
							style={styles.mapImage}
							resizeMode='cover'
							onError={e => {
								console.log('[live map] image error:', e.nativeEvent);
							}}
						/>
					) : (
						<View style={styles.mapPlaceholder}>
							<ActivityIndicator size='large' />
							<Text style={styles.loadingText}>
								{isShared || isTracking ? 'Loading live location...' : 'Loading test location...'}
							</Text>
						</View>
					)}
				</View>

				{/* Live indicator */}
				{(isShared || isTracking) && <Text style={styles.liveIndicator}>🔴 Updates every 10 seconds</Text>}

				{/* Test mode info */}
				{!isShared && !isTracking && <Text style={styles.testInfo}>📍 Simulating movement every 10 seconds</Text>}

				{/* Buttons */}
				<View style={styles.buttons}>
					{isShared || isTracking ? (
						// Tracking mode buttons
						<TouchableOpacity onPress={onStopSharing} style={[styles.btn, styles.btnDanger]} testID='live-location-stop'>
							<Text style={[styles.btnText, styles.btnTextDanger]}>{isTracking ? 'Stop Sharing' : 'Stop Sharing'}</Text>
						</TouchableOpacity>
					) : (
						// Preview mode buttons
						<>
							<TouchableOpacity onPress={onCancel} style={styles.btn} testID='live-location-preview-cancel'>
								<Text style={styles.btnText}>{I18n.t('Cancel')}</Text>
							</TouchableOpacity>
							<TouchableOpacity
								disabled={submitting || !locationState?.coords}
								onPress={onShare}
								style={[styles.btn, styles.btnPrimary, !locationState?.coords && styles.btnDisabled]}
								testID='live-location-preview-share'>
								{submitting ? (
									<ActivityIndicator color='#fff' />
								) : (
									<Text style={[styles.btnText, styles.btnTextPrimary]}>Share Live Location</Text>
								)}
							</TouchableOpacity>
						</>
					)}
				</View>
			</View>
		</View>
	);
}

// Helper functions for external access
export function isLiveLocationActive(): boolean {
	return globalTracker !== null && globalTracker.getCurrentState()?.isActive === true;
}

export function reopenLiveLocationModal() {
	if (globalTracker && globalTrackerParams) {
		Navigation.navigate('LiveLocationPreviewModal', globalTrackerParams);
	}
}

export function stopGlobalLiveLocation() {
	if (globalTracker) {
		globalTracker.stopTracking();
		globalTracker = null;
		globalTrackerParams = null;
		globalLocationUpdateCallback = null;
		emitStatusChange();
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		justifyContent: 'center',
		backgroundColor: '#f5f5f5'
	},
	content: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 4 },
		elevation: 3
	},
	header: {
		alignItems: 'center',
		marginBottom: 12,
		position: 'relative'
	},
	title: {
		fontSize: 18,
		fontWeight: '600',
		textAlign: 'center'
	},
	ownerName: {
		fontSize: 14,
		color: '#666',
		marginTop: 4
	},
	minimizeButton: {
		position: 'absolute',
		top: 0,
		right: 0,
		paddingHorizontal: 12,
		paddingVertical: 6,
		backgroundColor: '#f0f0f0',
		borderRadius: 15
	},
	minimizeText: {
		fontSize: 12,
		color: '#666',
		fontWeight: '500'
	},
	statusContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 12
	},
	statusDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		marginRight: 8
	},
	statusText: {
		fontSize: 14,
		fontWeight: '500'
	},
	infoContainer: {
		marginBottom: 16,
		alignItems: 'center'
	},
	coordsLine: {
		fontSize: 14,
		fontWeight: '500',
		textAlign: 'center',
		marginBottom: 4
	},
	timestamp: {
		fontSize: 12,
		opacity: 0.7,
		textAlign: 'center'
	},
	mapLinkText: {
		color: '#1d74f5',
		fontSize: 16,
		fontWeight: '600',
		textAlign: 'center',
		marginBottom: 16
	},
	disabledLink: {
		color: '#ccc'
	},
	mapContainer: {
		borderRadius: 8,
		overflow: 'hidden',
		marginBottom: 12
	},
	mapImage: {
		width: '100%',
		height: 200
	},
	mapPlaceholder: {
		width: '100%',
		height: 200,
		backgroundColor: '#eee',
		justifyContent: 'center',
		alignItems: 'center'
	},
	loadingText: {
		marginTop: 8,
		fontSize: 14,
		opacity: 0.7
	},
	liveIndicator: {
		fontSize: 12,
		color: '#FF5722',
		textAlign: 'center',
		marginBottom: 16,
		fontStyle: 'italic'
	},
	testInfo: {
		fontSize: 12,
		color: '#FF9800',
		textAlign: 'center',
		marginBottom: 16,
		fontStyle: 'italic'
	},
	buttons: {
		flexDirection: 'row',
		gap: 12
	},
	btn: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#ccc',
		backgroundColor: '#fff'
	},
	btnPrimary: {
		backgroundColor: '#1d74f5',
		borderColor: '#1d74f5'
	},
	btnDanger: {
		backgroundColor: '#FF5722',
		borderColor: '#FF5722'
	},
	btnDisabled: {
		backgroundColor: '#ccc',
		borderColor: '#ccc'
	},
	btnText: {
		fontWeight: '600'
	},
	btnTextPrimary: {
		color: '#fff'
	},
	btnTextDanger: {
		color: '#fff'
	}
});
