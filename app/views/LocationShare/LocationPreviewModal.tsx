import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { shallowEqual } from 'react-redux';

import I18n from '../../i18n';
import Navigation from '../../lib/navigation/appNavigation';
import { sendMessage } from '../../lib/methods/sendMessage';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../selectors/login';
import { staticMapUrl, providerLabel, mapsDeepLink, providerAttribution } from './services/mapProviders';
import type { MapProviderName } from './services/mapProviders';
import { useTheme } from '../../theme';

const OSM_HEADERS = {
	'User-Agent': 'RocketChatMobile/1.0 (+https://rocket.chat) contact: mobile@rocket.chat',
	Referer: 'https://rocket.chat'
};

type Coords = { latitude: number; longitude: number; accuracy?: number; timestamp?: number };

type RouteParams = {
	rid: string;
	tmid?: string;
	provider: MapProviderName;
	coords: Coords;
};

export default function LocationPreviewModal({ route }: { route: { params: RouteParams } }) {
	const { rid, tmid, provider, coords } = route.params;
	const [submitting, setSubmitting] = useState(false);
	const { colors } = useTheme();

	const mounted = useRef(true);
	useEffect(
		() => () => {
			mounted.current = false;
		},
		[]
	);
	const safeSet = (fn: () => void) => {
		if (mounted.current) fn();
	};

	const { id, username } = useAppSelector(
		state => ({
			id: getUserSelector(state).id,
			username: getUserSelector(state).username
		}),
		shallowEqual
	);

	const mapInfo = useMemo(() => {
		const opts = { zoom: 15 };
		return staticMapUrl('osm', { latitude: coords.latitude, longitude: coords.longitude }, opts);
	}, [coords.latitude, coords.longitude]);

	const cacheKey = useMemo(
		() => `osm-${coords.latitude.toFixed(5)}-${coords.longitude.toFixed(5)}-z15-v2`,
		[coords.latitude, coords.longitude]
	);

	useEffect(() => {
		if (mapInfo?.url) {
			ExpoImage.prefetch(mapInfo.url).catch(() => {
				// Ignore prefetch errors
			});
		}
	}, [mapInfo?.url]);

	const openInMaps = async () => {
		try {
			const deep = await mapsDeepLink(provider, coords);
			await Linking.openURL(deep);
		} catch (error) {
			Alert.alert(I18n.t('error-open-maps-application'));
		}
	};

	const onCancel = () => Navigation.back();

	const onShare = async () => {
		try {
			safeSet(() => setSubmitting(true));

			const deep = await mapsDeepLink(provider, coords);
			const providerName = providerLabel(provider);

			const message = I18n.t('Share_Location_Message', {
				location: I18n.t('Location'),
				openText: I18n.t('Open_in_provider', { provider: providerName }),
				link: deep
			});

			await sendMessage(rid, message, tmid, { id, username }, false);
			Navigation.back();
		} catch (e) {
			const error = e as Error;
			Alert.alert(I18n.t('Oops'), error?.message || I18n.t('Could_not_send_message'));
		} finally {
			safeSet(() => setSubmitting(false));
		}
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.surfaceNeutral }]}>
			<View style={[styles.content, { backgroundColor: colors.surfaceLight, shadowColor: colors.fontDefault }]}>
				<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>📍 {I18n.t('Share_Location')}</Text>
				<View style={styles.infoContainer}>
					<Text style={[styles.coordsLine, { color: colors.fontDefault }]}>
						{coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
					</Text>
					{coords.accuracy ? (
						<Text style={[styles.accuracyText, { color: colors.fontSecondaryInfo }]}>
							{I18n.t('Accuracy', { meters: Math.round(coords.accuracy) })}
						</Text>
					) : null}
				</View>
				<TouchableOpacity onPress={openInMaps}>
					<Text style={[styles.mapLinkText, { color: colors.buttonBackgroundPrimaryDefault }]}>
						🗺️ {I18n.t('Open_in_provider', { provider: providerLabel(provider) })}
					</Text>
				</TouchableOpacity>{' '}
				<View style={styles.mapContainer}>
					<ExpoImage
						source={{ uri: mapInfo.url, headers: OSM_HEADERS, cacheKey }}
						style={styles.mapImage}
						contentFit='cover'
						transition={200}
						cachePolicy='disk'
						placeholder={BLURHASH_PLACEHOLDER}
						onError={() => {
							// Image failed to load
						}}
					/>
					<View style={styles.pinOverlay} pointerEvents='none'>
						<Text style={styles.pinText}>📍</Text>
					</View>
				</View>
				<Text style={[styles.attribution, { color: colors.fontSecondaryInfo }]}>{providerAttribution('osm')}</Text>
				<View style={styles.buttons}>
					<TouchableOpacity
						style={[styles.btn, { borderColor: colors.strokeLight, backgroundColor: colors.surfaceLight }]}
						onPress={onCancel}>
						<Text style={[styles.btnText, { color: colors.fontDefault }]}>{I18n.t('Cancel')}</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.btn,
							styles.btnPrimary,
							{ backgroundColor: colors.buttonBackgroundPrimaryDefault, borderColor: colors.buttonBackgroundPrimaryDefault }
						]}
						onPress={onShare}
						disabled={submitting}>
						<Text style={[styles.btnText, styles.btnTextPrimary, { color: colors.fontWhite }]}>
							{submitting ? I18n.t('Sharing_Loading') : I18n.t('Share_Location')}
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}

const BLURHASH_PLACEHOLDER = 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH';

const styles = StyleSheet.create({
	container: { flex: 1, padding: 16, justifyContent: 'center' },
	content: {
		borderRadius: 12,
		padding: 16,
		shadowOpacity: 0.1,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 4 },
		elevation: 3
	},
	title: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
	infoContainer: { marginBottom: 16, alignItems: 'center' },
	coordsLine: { fontSize: 14, fontWeight: '500', textAlign: 'center', marginBottom: 4 },
	accuracyText: { fontSize: 12, textAlign: 'center' },
	mapLinkText: {
		fontSize: 16,
		fontWeight: '600',
		textAlign: 'center',
		marginBottom: 16
	},
	mapContainer: { borderRadius: 8, overflow: 'hidden', marginBottom: 12 },
	mapImage: { width: '100%', height: 200 },
	pinOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
	pinText: { fontSize: 24 },
	attribution: { fontSize: 10, textAlign: 'center', marginBottom: 12 },
	buttons: { flexDirection: 'row', gap: 12 },
	btn: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 10,
		alignItems: 'center',
		borderWidth: 1
	},
	btnPrimary: {},
	btnText: { fontWeight: '600' },
	btnTextPrimary: {}
});
