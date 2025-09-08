import { Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { MapProviderName, mapsDeepLink, staticMapUrl, providerAttribution } from './mapProviders';

export type Coords = { latitude: number; longitude: number; accuracy?: number; timestamp?: number };

export async function getCurrentPositionOnce(): Promise<Coords> {
  if (Platform.OS === 'ios') {
    const status = await Geolocation.requestAuthorization('whenInUse');
    if (status !== 'granted') throw new Error('Location permission not granted');
  }
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude, accuracy } = pos.coords;
        resolve({ latitude, longitude, accuracy, timestamp: pos.timestamp });
      },
      err => reject(new Error(err?.message || 'Failed to get location')),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
        forceRequestLocation: true,
        showLocationDialog: true
      }
    );
  });
}

export async function createStaticLocationAttachment(
  provider: MapProviderName,
  coords: Coords,
  googleApiKey?: string,
  osmApiKey?: string
) {
  const { url, width, height } = staticMapUrl(
    provider,
    { latitude: coords.latitude, longitude: coords.longitude },
    { size: '640x320', zoom: 15, googleApiKey, osmApiKey }
  );

  const mapImage = encodeURI(url);
  const deep = await mapsDeepLink(provider, {
    latitude: coords.latitude,
    longitude: coords.longitude
  });

  console.log('[staticLocationAttachment] provider:', provider);
  console.log('[staticLocationAttachment] coords:', coords);
  console.log('[staticLocationAttachment] mapImage URL:', mapImage);
  console.log('[staticLocationAttachment] dimensions:', { width, height });
  console.log('[staticLocationAttachment] deep link:', deep);

  return {
    title: 'Open in Maps',
    title_link: deep,
    title_link_download: false,

    image_url: mapImage,
    image_type: 'image/png',
    image_dimensions: { width, height }, // ✅ uses the values from staticMap
    description: `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
    ts: new Date(),
    footer: providerAttribution(provider),
    fields: [
      {
        short: true,
        title: 'Accuracy (m)',
        value: coords.accuracy != null ? String(Math.round(coords.accuracy)) : '—'
      }
    ]
  };
}
