import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';

import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { useUserPreferences } from '../../../lib/methods/userPreferences';
import { MAP_PROVIDER_DEFAULT, MAP_PROVIDER_PREFERENCE_KEY } from '../../../lib/constants/keys';
import {
	mapsDeepLink,
	staticMapUrl,
	providerAttribution,
	providerLabel
} from '../../../views/LocationShare/services/mapProviders';
import type { MapProviderName } from '../../../views/LocationShare/services/mapProviders';
import I18n from '../../../i18n';
import { useTheme } from '../../../theme';

type Props = {
	msg?: string | null;
};

type Coords = { latitude: number; longitude: number };

function extractCoordsFromMessage(msg?: string | null): Coords | null {
	if (!msg) return null;

	// geo:lat,lon
	let m = msg.match(/geo:([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)/i);
	if (m) return { latitude: Number(m[1]), longitude: Number(m[2]) };
	// geo:0,0?q=lat,lon (allow %2C)
	m = msg.match(/geo:[^\s?]*\?q=([+-]?\d+\.?\d*)(?:,|%2C)([+-]?\d+\.?\d*)/i);
	if (m) return { latitude: Number(m[1]), longitude: Number(m[2]) };

	// Apple Maps: ?ll=lat,lon or ?q=lat,lon
	m = msg.match(/maps\.apple\.com\/(?:\?[^\s]*?)(?:[?&]ll=)([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)/i);
	if (m) return { latitude: Number(m[1]), longitude: Number(m[2]) };
	m = msg.match(/maps\.apple\.com\/(?:\?[^\s]*?)(?:[?&]q=)([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)/i);
	if (m) return { latitude: Number(m[1]), longitude: Number(m[2]) };

	// Google Maps: comgooglemaps://?q=lat,lon or ...?center=lat,lon (allow %2C)
	m = msg.match(/comgooglemaps:\/\/\?(?:[^\s)]*?)(?:[?&])(?:q|center)=([+-]?\d+\.?\d*)(?:,|%2C)([+-]?\d+\.?\d*)/i);
	if (m) return { latitude: Number(m[1]), longitude: Number(m[2]) };
	// https://www.google.com/maps/... with query|q|center
	m = msg.match(/google\.com\/maps\/(?:[^\s)]*?)(?:[?&](?:query|q|center)=)([+-]?\d+\.?\d*)(?:,|%2C)([+-]?\d+\.?\d*)/i);
	if (m) return { latitude: Number(m[1]), longitude: Number(m[2]) };
	// https://www.google.com/maps/@lat,lon,zoom
	m = msg.match(/google\.com\/maps\/(?:[^\s)]*?)@([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)/i);
	if (m) return { latitude: Number(m[1]), longitude: Number(m[2]) };
	// https://maps.google.com/?q=lat,lon (allow %2C)
	m = msg.match(/maps\.google\.com\/(?:[^\s)]*?)(?:[?&](?:q|query|center)=)([+-]?\d+\.?\d*)(?:,|%2C)([+-]?\d+\.?\d*)/i);
	if (m) return { latitude: Number(m[1]), longitude: Number(m[2]) };

	// OpenStreetMap: ?mlat=lat&mlon=lon or #map=z/lat/lon
	m = msg.match(/openstreetmap\.org\/(?:[^\s]*?)(?:[?&]mlat=)([+-]?\d+\.?\d*)(?:[^\s]*?)(?:[?&]mlon=|&mlon=)([+-]?\d+\.?\d*)/i);
	if (m) return { latitude: Number(m[1]), longitude: Number(m[2]) };
	m = msg.match(/openstreetmap\.org\/[^\s#]*#map=\d+\/([+-]?\d+\.?\d*)\/([+-]?\d+\.?\d*)/i);
	if (m) return { latitude: Number(m[1]), longitude: Number(m[2]) };

	return null;
}

export function isCurrentLocationMessage(msg?: string | null): boolean {
	return !!extractCoordsFromMessage(msg);
}

const OSM_HEADERS = {
	'User-Agent': 'RocketChatMobile/1.0 (+https://rocket.chat) contact: mobile@rocket.chat',
	Referer: 'https://rocket.chat'
};

const styles = StyleSheet.create({
	card: {
		borderRadius: 12,
		borderWidth: 1,
		overflow: 'hidden'
	},
	header: {
		paddingHorizontal: 12,
		paddingTop: 12,
		paddingBottom: 4
	},
	title: { fontSize: 16, fontWeight: '700' },
	coords: { fontSize: 13, marginTop: 2 },
	link: {
		fontSize: 14,
		fontWeight: '700',
		paddingHorizontal: 12,
		paddingVertical: 8
	},
	mapContainer: { borderTopWidth: 1, borderBottomWidth: 1 },
	mapImage: { width: '100%', height: 180 },
	pinOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
	pinText: { fontSize: 22 },
	pressed: { opacity: 0.92 },
	attribution: { fontSize: 10, textAlign: 'center', paddingVertical: 6 }
});

const CurrentLocationCard: React.FC<Props> = ({ msg }) => {
	const { colors } = useTheme();
	const coords = useMemo(() => extractCoordsFromMessage(msg), [msg]);
	const userId = useAppSelector(state => state.login.user.id);
	const [viewerProvider] = useUserPreferences<MapProviderName>(`${MAP_PROVIDER_PREFERENCE_KEY}_${userId}`, MAP_PROVIDER_DEFAULT);

	const mapUrl = useMemo(() => {
		if (!coords) return undefined;
		return staticMapUrl('osm', coords, { zoom: 15 }).url;
	}, [coords]);

	const cacheKey = useMemo(
		() => (coords ? `osm-${coords.latitude.toFixed(5)}-${coords.longitude.toFixed(5)}-z15-v2` : undefined),
		[coords]
	);

	const openLabel = useMemo(() => I18n.t('Open_in_provider', { provider: providerLabel(viewerProvider) }), [viewerProvider]);

	const onOpen = async () => {
		if (!coords) return;
		try {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		} catch {
			// noop
		}
		const deep = await mapsDeepLink(viewerProvider, coords);
		try {
			const canOpen = await Linking.canOpenURL(deep);
			if (canOpen) {
				await Linking.openURL(deep);
			}
		} catch {
			// ignore
		}
	};

	if (!coords) {
		return null;
	}

	return (
		<View style={[styles.card, { borderColor: colors.strokeLight, backgroundColor: colors.surfaceLight }]}>
			<View style={styles.header}>
				<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>📍 {I18n.t('Location')}</Text>
				<Text style={[styles.coords, { color: colors.fontSecondaryInfo }]}>
					{coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
				</Text>
			</View>

			{mapUrl ? (
				<Pressable
					onPress={onOpen}
					accessibilityRole='button'
					accessibilityLabel={openLabel}
					android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
					style={({ pressed }) => [styles.mapContainer, { borderColor: colors.strokeLight }, pressed && styles.pressed]}>
					<ExpoImage
						source={{ uri: mapUrl, headers: OSM_HEADERS, cacheKey }}
						style={styles.mapImage}
						contentFit='cover'
						transition={150}
						cachePolicy='disk'
					/>
					<View style={styles.pinOverlay} pointerEvents='none'>
						<Text style={styles.pinText}>📍</Text>
					</View>
				</Pressable>
			) : null}

			<Text style={[styles.attribution, { color: colors.fontSecondaryInfo }]}>{providerAttribution('osm')}</Text>

			<TouchableOpacity onPress={onOpen} activeOpacity={0.7} accessibilityRole='button' accessibilityLabel={openLabel}>
				<Text style={[styles.link, { color: colors.buttonBackgroundPrimaryDefault }]}>🗺️ {openLabel}</Text>
			</TouchableOpacity>
		</View>
	);
};

export default CurrentLocationCard;
