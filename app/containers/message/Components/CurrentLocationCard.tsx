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

// ---------- Types ----------
type Props = {
	msg?: string | null;
};

type Coords = {
	latitude: number;
	longitude: number;
};

// ---------- Utils ----------
function toNumber(n?: string): number | undefined {
	if (!n) return undefined;
	const x = Number(n);
	return Number.isFinite(x) ? x : undefined;
}

function parsePair(raw?: string): Coords | null {
	if (!raw) return null;
	try {
		const decoded = decodeURIComponent(raw);
		const [la, lo] = decoded.split(',');
		const lat = toNumber(la?.trim());
		const lon = toNumber(lo?.trim());
		if (lat !== undefined && lon !== undefined) return { latitude: lat, longitude: lon };
	} catch {
		// ignore decode errors
	}
	return null;
}

export function extractCoordsFromMessage(msg?: string | null): Coords | null {
	if (!msg) return null;
	const s = msg.trim();

	let m = s.match(/[?&]q=([^&]+)/i);
	if (m) {
		const pair = parsePair(m[1]);
		if (pair) return pair;
	}

	m = s.match(/^geo:\s*([+\-%0-9.]+),([+\-%0-9.]+)/i);
	if (m) {
		const lat = toNumber(decodeURIComponent(m[1]));
		const lon = toNumber(decodeURIComponent(m[2]));
		if (lat !== undefined && lon !== undefined) return { latitude: lat, longitude: lon };
	}

	m = s.match(/maps\.apple\.com\/[^]*?[?&]ll=([^&]+)/i);
	if (m) {
		const pair = parsePair(m[1]);
		if (pair) return pair;
	}

	m = s.match(/maps\.apple\.com\/[^]*?[?&]q=([^&]+)/i);
	if (m) {
		const pair = parsePair(m[1]);
		if (pair) return pair;
	}

	m = s.match(/google\.com\/maps\/[^]*?[?&](?:q|query|center)=([^&]+)/i);
	if (m) {
		const pair = parsePair(m[1]);
		if (pair) return pair;
	}

	m = s.match(/google\.com\/maps\/[^@]*@([+\-%0-9.]+),([+\-%0-9.]+)/i);
	if (m) {
		const lat = toNumber(decodeURIComponent(m[1]));
		const lon = toNumber(decodeURIComponent(m[2]));
		if (lat !== undefined && lon !== undefined) return { latitude: lat, longitude: lon };
	}

	m = s.match(/comgooglemaps:\/\/[^]*?[?&](?:q|center)=([^&]+)/i);
	if (m) {
		const pair = parsePair(m[1]);
		if (pair) return pair;
	}

	const mlat = s.match(/[?&]mlat=([^&]+)/i)?.[1];
	const mlon = s.match(/[?&]mlon=([^&]+)/i)?.[1];
	if (mlat && mlon) {
		const lat = toNumber(decodeURIComponent(mlat));
		const lon = toNumber(decodeURIComponent(mlon));
		if (lat !== undefined && lon !== undefined) return { latitude: lat, longitude: lon };
	}

	m = s.match(/openstreetmap\.org\/[^#]*#map=\d+\/([+\-%0-9.]+)\/([+\-%0-9.]+)/i);
	if (m) {
		const lat = toNumber(decodeURIComponent(m[1]));
		const lon = toNumber(decodeURIComponent(m[2]));
		if (lat !== undefined && lon !== undefined) return { latitude: lat, longitude: lon };
	}

	return null;
}

export function isCurrentLocationMessage(msg?: string | null): boolean {
	return !!extractCoordsFromMessage(msg);
}

// ---------- Constants ----------
const OSM_HEADERS = {
	'User-Agent': 'RocketChatMobile/1.0 (+https://rocket.chat) contact: mobile@rocket.chat',
	Referer: 'https://rocket.chat'
};

// ---------- Styles ----------
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
	title: {
		fontSize: 16,
		fontWeight: '700'
	},
	coords: {
		fontSize: 13,
		marginTop: 2
	},
	link: {
		fontSize: 14,
		fontWeight: '700',
		paddingHorizontal: 12,
		paddingVertical: 8
	},
	mapContainer: {
		borderTopWidth: 1,
		borderBottomWidth: 1
	},
	mapImage: {
		width: '100%',
		height: 180
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
	pinText: {
		fontSize: 22
	},
	pressed: {
		opacity: 0.92
	},
	attribution: {
		fontSize: 10,
		textAlign: 'center',
		paddingVertical: 6
	}
});

// ---------- Component ----------
const CurrentLocationCard: React.FC<Props> = ({ msg }) => {
	const { colors } = useTheme();
	const coords = useMemo(() => extractCoordsFromMessage(msg), [msg]);
	const userId = useAppSelector(state => state.login.user.id);
	const [viewerProvider] = useUserPreferences<MapProviderName>(
		`${MAP_PROVIDER_PREFERENCE_KEY}_${userId}`,
		MAP_PROVIDER_DEFAULT
	);

	const mapUrl = useMemo(() => {
		if (!coords) return undefined;
		return staticMapUrl('osm', coords, { zoom: 15 }).url;
	}, [coords]);

	const cacheKey = useMemo(
		() => (coords ? `osm-${coords.latitude.toFixed(5)}-${coords.longitude.toFixed(5)}-z15-v2` : undefined),
		[coords]
	);

	const openLabel = useMemo(
		() => I18n.t('Open_in_provider', { provider: providerLabel(viewerProvider) }),
		[viewerProvider]
	);

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

	if (!coords) return null;

	return (
		<View style={[styles.card, { borderColor: colors.strokeLight, backgroundColor: colors.surfaceLight }]}>
			<View style={styles.header}>
				<Text style={[styles.title, { color: colors.fontTitlesLabels }]}>
					📍 {I18n.t('Location')}
				</Text>
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
					style={({ pressed }) => [
						styles.mapContainer,
						{ borderColor: colors.strokeLight },
						pressed && styles.pressed
					]}>
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

			<Text style={[styles.attribution, { color: colors.fontSecondaryInfo }]}>
				{providerAttribution('osm')}
			</Text>

			<TouchableOpacity
				onPress={onOpen}
				activeOpacity={0.7}
				accessibilityRole='button'
				accessibilityLabel={openLabel}>
				<Text style={[styles.link, { color: colors.buttonBackgroundPrimaryDefault }]}>
					🗺️ {openLabel}
				</Text>
			</TouchableOpacity>
		</View>
	);
};

export default CurrentLocationCard;
