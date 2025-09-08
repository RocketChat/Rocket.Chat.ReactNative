import React, { useMemo, useState } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import I18n from '../../i18n';
import Navigation from '../../lib/navigation/appNavigation';

import { sendMessage } from '../../lib/methods/sendMessage'; // your small wrapper (default export)
import { staticMapUrl, MapProviderName, providerLabel } from './services/mapProviders';
import { createStaticLocationAttachment, Coords } from './services/staticLocation';
import { getCurrentUser } from '../../lib/methods/getCurrentUser';

type RouteParams = {
  rid: string;
  tmid?: string;
  provider: MapProviderName; // 'osm' | 'google'
  coords: Coords;
  googleKey?: string;        // optional; omit to use OSM
  osmKey?: string; 
};

export default function LocationPreviewModal({ route }: { route: { params: RouteParams } }) {
  const { rid, tmid, provider, coords, googleKey, osmKey } = route.params;
  const [submitting, setSubmitting] = useState(false);

  const mapUrl = useMemo(() => {
    const opts: any = { size: '640x320', zoom: 15 };
    if (provider === 'google' && googleKey) opts.googleApiKey = googleKey;
    if (provider === 'osm' && osmKey)    opts.osmApiKey    = osmKey; // <-- consume it
    return staticMapUrl(provider, { latitude: coords.latitude, longitude: coords.longitude }, opts);
    }, [provider, coords.latitude, coords.longitude, googleKey, osmKey]);

  const onCancel = () => Navigation.back();

  const onShare = async () => {
    try {
      setSubmitting(true);
      const attachment = await createStaticLocationAttachment(provider, coords, googleKey, osmKey);
      const user = await getCurrentUser();
      await sendMessage(
        rid,                    // 1st parameter: room id
        '📍 Location',          // 2nd parameter: message text
        tmid,                   // 3rd parameter: thread message id (optional)
        user,            // 4th parameter: user object
        false,                  // 5th parameter: tshow (optional, defaults to false)
        [attachment]            // 6th parameter: attachments array (new parameter)
    );
      Navigation.back();
    } catch (e: any) {
      Alert.alert(I18n.t('Oops'), e?.message || I18n.t('Could_not_get_location'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {mapUrl ? (
            <Image
                source={{ uri: (mapUrl as { url: string }).url }}
                style={{ width: 640, height: 320 }}
                resizeMode="cover"
                onLoadStart={() => console.log('[static map] loading', mapUrl)}
                onError={e => {
                console.log('[static map] image error:', e.nativeEvent);
                console.log('[static map] attempted URL:', (mapUrl as { url: string }).url);
                Alert.alert('Map preview failed', 'Tap Share to send anyway, or try again.');
                }}
                onLoadEnd={() => console.log('[static map] load end')}
            />
            ) : (
            <ActivityIndicator style={styles.map} />
            )}
        <View style={styles.meta}>
          <Text style={styles.title}>{I18n.t('Preview_location')}</Text>
          <View style={styles.row}>
            <Text style={styles.coords}>{coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</Text>
            <Text style={styles.accuracy}>{coords.accuracy ? `±${Math.round(coords.accuracy)}m` : ''}</Text>
          </View>
          <Text style={styles.provider}>{providerLabel(provider)}</Text>

          <View style={styles.buttons}>
            <TouchableOpacity onPress={onCancel} style={styles.btn} testID="location-preview-cancel">
              <Text style={styles.btnText}>{I18n.t('Cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={submitting} onPress={onShare} style={[styles.btn, styles.btnPrimary]} testID="location-preview-share">
              {submitting ? <ActivityIndicator /> : <Text style={[styles.btnText, styles.btnTextPrimary]}>{I18n.t('Share')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  map: { width: '100%', height: 220, backgroundColor: '#eee' },
  meta: { padding: 14 },
  title: { fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  coords: { fontSize: 14 },
  accuracy: { fontSize: 14, opacity: 0.7 },
  provider: { marginTop: 6, fontSize: 12, opacity: 0.7 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff'
  },
  btnPrimary: { backgroundColor: '#1d74f5', borderColor: '#1d74f5' },
  btnText: { fontWeight: '600' },
  btnTextPrimary: { color: '#fff' }
});
