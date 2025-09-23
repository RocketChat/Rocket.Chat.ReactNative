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
	const { id, token, username } = useAppSelector(
		state => ({
			id: getUserSelector(state).id,
			token: getUserSelector(state).token,
			username: getUserSelector(state).username
		}),
		shallowEqual
	);

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

		return () => {};
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

	const onStopSharing = async () => {
		// If the user is just viewing (not the owner), simply close the modal
		if (!isOwner()) {
			Navigation.back();
			return;
		}

		// Owner stopping the live location sharing
		if (trackerRef.current) {
			const currentState = trackerRef.current.getCurrentState();

			// Resolve the correct liveLocationId (route OR global)
			const idToStop = liveLocationId ?? (globalTrackerParams && globalTrackerParams.liveLocationId) ?? null;

			// Stop tracking first
			trackerRef.current.stopTracking();
			globalTracker = null;
			globalTrackerParams = null;
			globalLocationUpdateCallback = null;

			// Mark session as ended so UI disables "View Live Location"
			if (idToStop) {
				try {
					markLiveLocationAsEnded(idToStop);
				} catch (e) {
					console.error('Failed to mark live location as ended:', e);
				}
			}

			// Notify listeners AFTER marking ended
			emitStatusChange();

			// Best effort stop message with the last known coords
			if (idToStop && currentState?.coords) {
				try {
					const stopMessage = createLiveLocationStopMessage(idToStop, provider, currentState.coords);
					await sendMessage(rid, stopMessage, tmid, { id, username }, false);
				} catch (error) {
					console.error('Failed to send stop message:', error);
				}
			}
		}

		// Update local UI too
		setIsShared(false);
		Navigation.back();
	};

	const formatTimestamp = (timestamp: number) => {
		return new Date(timestamp).toLocaleTimeString();
	};

	// Determine if the current user is the owner of this live location
	const isOwner = () => {
		// If isTracking is true, this user started the sharing session
		if (isTracking) return true;

		// If ownerName exists and matches current username, this user is the owner
		if (ownerName && username && ownerName === username) return true;

		// If no ownerName is provided but isShared is true, assume this user is the owner
		if (!ownerName && isShared) return true;

		// Otherwise, this user is just viewing
		return false;
	};

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				{/* Header with minimize button */}
				<View style={styles.header}>
					<View style={styles.titleContainer}>
						<Text style={styles.title}>{isShared || isTracking ? '📍 Live Location' : '🧪 Live Location Preview'}</Text>
						{ownerName && <Text style={styles.ownerName}>Shared by {ownerName}</Text>}
					</View>
					{/* Minimize button - only show when sharing */}
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
					<View style={[styles.statusDot, { backgroundColor: locationState?.isActive ? '#27ae60' : '#e74c3c' }]} />
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
							<Text style={[styles.btnText, styles.btnTextDanger]}>{isOwner() ? 'Stop Sharing' : 'Stop Viewing'}</Text>
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
		// Mark the live location session as ended if we have the ID
		if (globalTrackerParams?.liveLocationId) {
			markLiveLocationAsEnded(globalTrackerParams.liveLocationId);
		}

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
		padding: 20,
		justifyContent: 'center',
		backgroundColor: '#ecf0f1'
	},
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
	minimizeButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#f8f9fa',
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		borderWidth: 1,
		borderColor: '#e9ecef'
	},
	minimizeIcon: {
		width: 20,
		height: 20,
		justifyContent: 'center',
		alignItems: 'center'
	},
	minimizeLine: {
		width: 14,
		height: 2,
		backgroundColor: '#6c757d',
		borderRadius: 1
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
		shadowOffset: {
			width: 0,
			height: 4
		},
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
	testInfo: {
		fontSize: 13,
		color: '#f39c12',
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
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2
	},
	btnPrimary: {
		backgroundColor: '#3498db',
		borderColor: '#3498db'
	},
	btnDanger: {
		backgroundColor: '#e74c3c',
		borderColor: '#e74c3c'
	},
	btnDisabled: {
		backgroundColor: '#ecf0f1',
		borderColor: '#bdc3c7'
	},
	btnText: {
		fontWeight: '700',
		fontSize: 16,
		color: '#2c3e50'
	},
	btnTextPrimary: {
		color: '#ffffff'
	},
	btnTextDanger: {
		color: '#ffffff'
	}
});
