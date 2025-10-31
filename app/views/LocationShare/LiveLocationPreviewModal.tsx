import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking, InteractionManager } from 'react-native';
import { Image as ExpoImage, type ImageErrorEventData } from 'expo-image';
import * as Location from 'expo-location';
import { shallowEqual } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import I18n from '../../i18n';
import Navigation from '../../lib/navigation/appNavigation';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../selectors/login';
import { useTheme } from '../../theme';
import { staticMapUrl, providerLabel, mapsDeepLink, providerAttribution } from './services/mapProviders';
import type { MapProviderName } from './services/mapProviders';
import { LiveLocationTracker } from './services/liveLocation';
import type { LiveLocationState } from './services/liveLocation';
import { LiveLocationApi, serverToMobileCoords } from './services/liveLocationApi';
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

const OSM_HEADERS = {
	'User-Agent': 'RocketChatMobile/1.0 (+https://rocket.chat) contact: mobile@rocket.chat',
	Referer: 'https://rocket.chat'
};

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
			// Ignore listener errors
		}
	});
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 20, justifyContent: 'center' },
	content: {
		borderRadius: 16,
		padding: 20,
		shadowOpacity: 0.15,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 6 },
		elevation: 8,
		borderWidth: 1
	},
	header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 },
	titleContainer: { flex: 1, alignItems: 'center' },
	title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
	ownerName: { fontSize: 14, marginTop: 4, fontWeight: '500' },
	minimizeButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		borderWidth: 1
	},
	minimizeIcon: { width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
	minimizeLine: { width: 14, height: 2, borderRadius: 1 },
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
	statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
	statusText: { fontSize: 14, fontWeight: '600' },
	infoContainer: {
		marginBottom: 20,
		alignItems: 'center',
		padding: 16,
		borderRadius: 12,
		borderWidth: 1
	},
	coordsLine: { fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 6 },
	timestamp: { fontSize: 12, textAlign: 'center', fontWeight: '500' },
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
	mapImage: { width: '100%', height: 220 },
	mapPlaceholder: { width: '100%', height: 220, justifyContent: 'center', alignItems: 'center' },
	loadingText: { marginTop: 12, fontSize: 14, fontWeight: '500' },
	attribution: { fontSize: 10, textAlign: 'center', marginBottom: 12 },
	pinOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
	pinText: { fontSize: 24 },
	liveIndicator: {
		fontSize: 13,
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
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2
	},
	btnPrimary: {},
	btnDanger: {},
	btnText: { fontWeight: '700', fontSize: 16 },
	btnTextPrimary: {},
	btnTextDanger: {}
});

export default function LiveLocationPreviewModal({ route }: { route: { params: RouteParams } }) {
	const { rid, tmid, provider = 'google', liveLocationId, ownerName, isTracking = false } = route.params;
	const navigation = useNavigation();
	const { colors } = useTheme();
	const [submitting, setSubmitting] = useState(false);
	const [locationState, setLocationState] = useState<LiveLocationState | null>(null);
	const [mapImageUrl, setMapImageUrl] = useState<string>('');
	const [isShared, setIsShared] = useState(isTracking);
	const [currentOwnerName, setCurrentOwnerName] = useState<string | undefined>(ownerName);
	const trackerRef = useRef<LiveLocationTracker | null>(null);
	const viewerUpdateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const statusEmitCallback = useRef<(state: LiveLocationState) => void>(() => {
		emitStatusChange();
	});
	const isMinimizingRef = useRef(false);

	useEffect(() => {
		isModalMinimized = false;
		emitMinimizedStatusChange(false);
	}, []);

	useEffect(() => {
		const unsubscribe = navigation.addListener('beforeRemove', e => {
			if (isMinimizingRef.current) {
				return;
			}

			const globalTrackerActive = globalTracker !== null && globalTracker.getCurrentState()?.isActive === true;

			const shouldMinimize = globalTrackerActive || (!isTracking && liveLocationId && locationState?.isActive);

			if (shouldMinimize) {
				e.preventDefault();
				isMinimizingRef.current = true;
				onMinimize();
			}
		});

		return () => {
			unsubscribe();
		};
	}, [navigation, isShared, isTracking, liveLocationId, locationState?.isActive]);

	const mounted = useRef(true);
	useEffect(() => {
		isMinimizingRef.current = false;

		return () => {
			mounted.current = false;
			isMinimizingRef.current = false;
			globalLocationUpdateCallbacks.delete(handleLocationUpdate);
			globalLocationUpdateCallbacks.delete(statusEmitCallback.current);
			if (viewerUpdateIntervalRef.current) {
				clearInterval(viewerUpdateIntervalRef.current);
				viewerUpdateIntervalRef.current = null;
			}
		};
	}, []);
	const safeSet = React.useCallback((fn: () => void) => {
		if (mounted.current) fn();
	}, []);

	useEffect(() => {
		if (mapImageUrl) {
			ExpoImage.prefetch(mapImageUrl).catch(() => {});
		}
	}, [mapImageUrl]);

	const cacheKey = useMemo(() => {
		const lat = locationState?.coords?.latitude;
		const lon = locationState?.coords?.longitude;
		return lat && lon ? `osm-${lat.toFixed(5)}-${lon.toFixed(5)}-z15-v2` : undefined;
	}, [locationState?.coords?.latitude, locationState?.coords?.longitude]);

	const { id, username } = useAppSelector(getUserSelector, shallowEqual);

	const handleLocationUpdate = React.useCallback(
		(state: LiveLocationState) => {
			safeSet(() => setLocationState(state));

			if (state.coords) {
				const { url } = staticMapUrl('osm', state.coords, { zoom: 15 });
				safeSet(() => setMapImageUrl(url));
			}

			emitStatusChange();
		},
		[safeSet]
	);

	useEffect(() => {
		if (!isTracking && liveLocationId) {
			isLiveLocationEnded(liveLocationId).then(ended => {
				if (ended) {
					Navigation.back();
					return;
				}

				const poll = async () => {
					try {
						const data = await LiveLocationApi.get(rid, liveLocationId);
						if (!data?.isActive || data?.stoppedAt) {
							try {
								await markLiveLocationAsEnded(liveLocationId);
							} catch {
								// Ignore cleanup errors
							}
							Navigation.back();
							return;
						}
						safeSet(() => setCurrentOwnerName(prev => prev || data.ownerName || data.ownerUsername));

						const mobile = serverToMobileCoords(data.coords);
						const ts = data.lastUpdateAt ? new Date(data.lastUpdateAt).getTime() : Date.now();
						const next: LiveLocationState = {
							coords: {
								latitude: mobile.latitude,
								longitude: mobile.longitude,
								accuracy: mobile.accuracy
							},
							timestamp: ts,
							isActive: true
						};
						handleLocationUpdate(next);
					} catch (_e) {
						// Ignore transient failures; keep last good state
					}
				};
				poll();
				viewerUpdateIntervalRef.current = setInterval(poll, 10_000);
			});

			const handleLiveLocationEnded = (endedLocationId: string) => {
				if (endedLocationId === liveLocationId) {
					Navigation.back();
				}
			};
			addLiveLocationEndedListener(handleLiveLocationEnded);

			return () => {
				removeLiveLocationEndedListener(handleLiveLocationEnded);
				if (viewerUpdateIntervalRef.current) {
					clearInterval(viewerUpdateIntervalRef.current);
					viewerUpdateIntervalRef.current = null;
				}
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
				},
				undefined,
				provider
			);

			trackerRef.current = tracker;
			globalLocationUpdateCallbacks.add(handleLocationUpdate);

			tracker.startTracking().catch(error => {
				Alert.alert(I18n.t('Error'), error.message || I18n.t('Could_not_get_location'));
			});
		} else {
			Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.High
			})
				.then((location: Location.LocationObject) => {
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
				})
				.catch((_error: unknown) => {
					Alert.alert(I18n.t('Error'), I18n.t('Could_not_get_location'));
				});
		}
	}, [isTracking, liveLocationId, handleLocationUpdate, id, rid, tmid, username]);

	const openInMaps = async () => {
		if (!locationState?.coords) return;
		try {
			const deep = await mapsDeepLink(provider, locationState.coords);
			await Linking.openURL(deep);
		} catch (error) {
			Alert.alert(I18n.t('error-open-maps-application'));
		}
	};

	const onCancel = () => {
		if (trackerRef.current && (isShared || isTracking)) {
			onMinimize();
			return;
		}

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

		if (globalTracker && globalTracker.getCurrentState()?.isActive) {
			Alert.alert(I18n.t('Live_Location_Active'), I18n.t('Live_Location_Active_Block_Message'), [
				{ text: I18n.t('View_Current_Session'), onPress: () => reopenLiveLocationModal() },
				{ text: I18n.t('Cancel'), style: 'cancel' }
			]);
			return;
		}

		try {
			safeSet(() => setSubmitting(true));

			if (!trackerRef.current) {
				const tracker = new LiveLocationTracker(
					rid,
					tmid,
					{ id, username },
					(state: LiveLocationState) => {
						globalLocationUpdateCallbacks.forEach(callback => {
							if (callback) callback(state);
						});
					},
					undefined,
					provider
				);

				trackerRef.current = tracker;
				globalLocationUpdateCallbacks.add(handleLocationUpdate);

				await tracker.startTracking();
			}

			if (trackerRef.current) {
				const msgId = trackerRef.current.getMsgId();
				if (!msgId) {
					Alert.alert(I18n.t('Error'), I18n.t('Live_Location_Start_Error'));
					return;
				}

				globalTracker = trackerRef.current;
				globalTrackerParams = {
					rid,
					tmid,
					provider,
					liveLocationId: msgId,
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
		} catch (e) {
			Alert.alert(I18n.t('Oops'), (e as Error)?.message || I18n.t('Could_not_send_message'));
		} finally {
			safeSet(() => setSubmitting(false));
		}
	};

	const onMinimize = () => {
		globalLocationUpdateCallbacks.delete(handleLocationUpdate);
		globalLocationUpdateCallbacks.delete(statusEmitCallback.current);
		globalLocationUpdateCallbacks.add(statusEmitCallback.current);

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

			try {
				await trackerRef.current.stopTracking();
			} catch (error) {
				// Ignore stop errors
			}

			if (msgId) {
				try {
					await markLiveLocationAsEnded(msgId);
				} catch (e) {
					// Ignore cleanup errors
				}
			}

			emitStatusChange(false);

			globalTracker = null;
			globalTrackerParams = null;
			globalLocationUpdateCallbacks.clear();

			isModalMinimized = false;
			emitMinimizedStatusChange(false);
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
		const shouldShowActiveButtons = isShared || isTracking || (!isTracking && liveLocationId);

		if (!shouldShowActiveButtons) {
			return (
				<>
					<TouchableOpacity
						onPress={onCancel}
						style={[
							styles.btn,
							{ borderColor: colors.strokeExtraLight, backgroundColor: colors.surfaceLight, shadowColor: colors.fontDefault }
						]}>
						<Text style={[styles.btnText, { color: colors.fontTitlesLabels }]}>{I18n.t('Cancel')}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						disabled={submitting || !locationState?.coords}
						onPress={onShare}
						style={[
							styles.btn,
							styles.btnPrimary,
							{
								backgroundColor: colors.buttonBackgroundPrimaryDefault,
								borderColor: colors.buttonBackgroundPrimaryDefault,
								shadowColor: colors.fontDefault
							},
							!locationState?.coords && {
								backgroundColor: colors.buttonBackgroundPrimaryDisabled,
								borderColor: colors.strokeLight
							}
						]}>
						{submitting ? (
							<ActivityIndicator color={colors.buttonFontPrimary} />
						) : (
							<Text style={[styles.btnText, styles.btnTextPrimary, { color: colors.buttonFontPrimary }]}>{I18n.t('Start')}</Text>
						)}
					</TouchableOpacity>
				</>
			);
		}

		if (isOwner() && !(!isTracking && liveLocationId)) {
			return (
				<TouchableOpacity
					onPress={onStopSharing}
					style={[
						styles.btn,
						styles.btnDanger,
						{
							backgroundColor: colors.buttonBackgroundDangerDefault,
							borderColor: colors.buttonBackgroundDangerDefault,
							shadowColor: colors.fontDefault
						}
					]}>
					<Text style={[styles.btnText, styles.btnTextDanger, { color: colors.buttonFontDanger }]}>{I18n.t('Stop_Sharing')}</Text>
				</TouchableOpacity>
			);
		}

		return (
			<TouchableOpacity
				onPress={isOwner() ? onMinimize : onCancel}
				style={[
					styles.btn,
					{ borderColor: colors.strokeExtraLight, backgroundColor: colors.surfaceLight, shadowColor: colors.fontDefault }
				]}>
				<Text style={[styles.btnText, { color: colors.fontTitlesLabels }]}>{I18n.t('Close')}</Text>
			</TouchableOpacity>
		);
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.surfaceNeutral }]}>
			<View
				style={[
					styles.content,
					{ backgroundColor: colors.surfaceLight, shadowColor: colors.fontDefault, borderColor: colors.strokeExtraLight }
				]}>
				<View style={styles.header}>
					<View style={styles.titleContainer}>
						<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>📍 {I18n.t('Live_Location')}</Text>
						{currentOwnerName && (
							<Text style={[styles.ownerName, { color: colors.fontSecondaryInfo }]}>
								{I18n.t('Shared_By')} {currentOwnerName}
							</Text>
						)}
					</View>
					{(isShared || isTracking) && isOwner() && (
						<TouchableOpacity
							onPress={onMinimize}
							style={[
								styles.minimizeButton,
								{ backgroundColor: colors.surfaceTint, shadowColor: colors.fontDefault, borderColor: colors.strokeExtraLight }
							]}
							activeOpacity={0.7}>
							<View style={styles.minimizeIcon}>
								<View style={[styles.minimizeLine, { backgroundColor: colors.strokeDark }]} />
							</View>
						</TouchableOpacity>
					)}
				</View>

				<View style={[styles.statusContainer, { backgroundColor: colors.surfaceTint, borderColor: colors.strokeExtraLight }]}>
					<View
						style={[
							styles.statusDot,
							{
								backgroundColor:
									(isShared || isTracking || (!isTracking && liveLocationId)) && locationState?.isActive
										? colors.userPresenceOnline
										: colors.buttonBackgroundDangerDefault
							}
						]}
					/>
					<Text style={[styles.statusText, { color: colors.fontHint }]}>
						{(isShared || isTracking || (!isTracking && liveLocationId)) && locationState?.isActive
							? I18n.t('Live_Location_Active')
							: I18n.t('Live_Location_Inactive')}
					</Text>
				</View>

				{locationState?.coords && (
					<View style={[styles.infoContainer, { backgroundColor: colors.surfaceLight, borderColor: colors.strokeExtraLight }]}>
						<Text style={[styles.coordsLine, { color: colors.fontTitlesLabels }]}>
							{locationState.coords.latitude.toFixed(5)}, {locationState.coords.longitude.toFixed(5)}
							{locationState.coords.accuracy ? ` (±${Math.round(locationState.coords.accuracy)}m)` : ''}
						</Text>
						<Text style={[styles.timestamp, { color: colors.fontSecondaryInfo }]}>
							{I18n.t('Last_updated_at')} {formatTimestamp(locationState.timestamp)}
						</Text>
					</View>
				)}

				<TouchableOpacity onPress={openInMaps} disabled={!locationState?.coords}>
					<Text
						style={[
							styles.mapLinkText,
							{ color: colors.buttonBackgroundPrimaryDefault },
							!locationState?.coords && { color: colors.fontDisabled }
						]}>
						🗺️ Open in {providerLabel(provider)}
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
									safeSet(() => setMapImageUrl(''));
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
							{locationState?.coords && (
								<Text style={[styles.loadingText, { fontSize: 14, marginBottom: 8, color: colors.fontSecondaryInfo }]}>
									{locationState.coords.latitude.toFixed(5)}, {locationState.coords.longitude.toFixed(5)}
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

				{(isShared || isTracking || (!isTracking && liveLocationId)) && (
					<Text style={[styles.liveIndicator, { color: colors.buttonBackgroundDangerDefault }]}>
						🔴 {I18n.t('Updates_every_10_seconds')}
					</Text>
				)}

				<View style={styles.buttons}>{renderActionButtons()}</View>
			</View>
		</View>
	);
}

export function isLiveLocationActive(): boolean {
	return globalTracker !== null && globalTracker.getCurrentState()?.isActive === true;
}

export function reopenLiveLocationModal() {
	if (!globalTracker || !globalTrackerParams) return;

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
			} catch (e) {
				// Ignore cleanup errors
			}
		}
	} finally {
		globalTracker = null;
		globalTrackerParams = null;
		globalLocationUpdateCallbacks.clear();

		isModalMinimized = false;
		emitMinimizedStatusChange(false);
		emitStatusChange(false);
	}
}

const BLURHASH_PLACEHOLDER = 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH';
