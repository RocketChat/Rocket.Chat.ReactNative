import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, Image } from 'react-native';
import Navigation from '../../lib/navigation/appNavigation';
import { staticMapUrl, MapProviderName, providerLabel, mapsDeepLink } from './services/mapProviders';
import { sendMessage } from '../../lib/methods/sendMessage';
import { useAppSelector } from '../../lib/hooks';
import { getUserSelector } from '../../selectors/login';
import { shallowEqual } from 'react-redux';
import I18n from '../../i18n';

type Coords = { latitude: number; longitude: number; accuracy?: number; timestamp?: number };

type RouteParams = {
	rid: string;
	tmid?: string;
	provider: MapProviderName; // 'osm' | 'google'
	coords: Coords;
	googleKey?: string; // optional; omit to use OSM
	osmKey?: string;
};

export default function LocationPreviewModal({ route }: { route: { params: RouteParams } }) {
	const { rid, tmid, provider, coords, googleKey, osmKey } = route.params;
	const [submitting, setSubmitting] = useState(false);

	const { id, token, username } = useAppSelector(
		state => ({
			id: getUserSelector(state).id,
			token: getUserSelector(state).token,
			username: getUserSelector(state).username
		}),
		shallowEqual
	);

	const mapUrl = useMemo(() => {
		const opts: any = { size: '640x320', zoom: 15 };
		if (provider === 'google' && googleKey) opts.googleApiKey = googleKey;
		if (provider === 'osm' && osmKey) opts.osmApiKey = osmKey;
		return staticMapUrl(provider, { latitude: coords.latitude, longitude: coords.longitude }, opts);
	}, [provider, coords.latitude, coords.longitude, googleKey, osmKey]);

	// Add deep link for preview
	const openInMaps = async () => {
		try {
			const deep = await mapsDeepLink(provider, coords);
			await Linking.openURL(deep);
		} catch (error) {
			console.error('Failed to open maps:', error);
			Alert.alert('Error', 'Could not open maps application');
		}
	};

	const onCancel = () => Navigation.back();

	const onShare = async () => {
		try {
			setSubmitting(true);

			const { url } = staticMapUrl(
				provider,
				{ latitude: coords.latitude, longitude: coords.longitude },
				{ size: '640x320', zoom: 15, googleApiKey: googleKey, osmApiKey: osmKey }
			);

			let deep = null;
			if (provider == 'google') {
				deep = await mapsDeepLink(provider, coords);
			} else {
				deep = url;
			}

			const locationText = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
			const providerName = providerLabel(provider);

			// Clean format with embedded link and map image
			const message = `📍 **Location**

**Coordinates:** ${locationText}

[🗺️ Open in ${providerName}](${deep})`;

			await sendMessage(rid, message, tmid, { id, username }, false);

			// Silently close the modal after successful location sharing
			Navigation.back();
		} catch (e: any) {
			console.error('[LocationPreview] Error sending message:', e);
			Alert.alert(I18n.t('Oops'), e?.message || I18n.t('Could_not_send_message'));
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>📍 Share Location</Text>

				<View style={styles.infoContainer}>
					<Text style={styles.coordsLine}>
						{coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
					</Text>
					{coords.accuracy && <Text style={styles.accuracyText}>Accuracy: ±{Math.round(coords.accuracy)}m</Text>}
				</View>

				<TouchableOpacity onPress={openInMaps}>
					<Text style={styles.mapLinkText}>🗺️ Open in {providerLabel(provider)}</Text>
				</TouchableOpacity>

				<View style={styles.mapContainer}>
					<Image source={{ uri: mapUrl.url }} style={styles.mapImage} resizeMode='cover' />
				</View>

				<View style={styles.buttons}>
					<TouchableOpacity style={styles.btn} onPress={onCancel}>
						<Text style={styles.btnText}>Cancel</Text>
					</TouchableOpacity>

					<TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onShare} disabled={submitting}>
						<Text style={[styles.btnText, styles.btnTextPrimary]}>{submitting ? 'Sharing...' : 'Share Location'}</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
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
	title: {
		fontSize: 18,
		fontWeight: '600',
		textAlign: 'center',
		marginBottom: 12
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
	accuracyText: {
		fontSize: 12,
		color: '#666',
		textAlign: 'center'
	},
	mapLinkText: {
		color: '#1d74f5',
		fontSize: 16,
		fontWeight: '600',
		textAlign: 'center',
		marginBottom: 16
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
	btnText: {
		fontWeight: '600'
	},
	btnTextPrimary: {
		color: '#fff'
	}
});
