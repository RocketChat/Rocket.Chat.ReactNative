import React, { useLayoutEffect, useState } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { StyleSheet, Text } from 'react-native';

import * as List from '../../containers/List';
import I18n from '../../i18n';
import SafeAreaView from '../../containers/SafeAreaView';
import { ProfileStackParamList } from '../../stacks/types';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import { useUserPreferences } from '../../lib/methods';
import {
	MAP_PROVIDER_PREFERENCE_KEY,
	GOOGLE_MAPS_API_KEY_PREFERENCE_KEY,
	OSM_API_KEY_PREFERENCE_KEY,
	MAP_PROVIDER_DEFAULT
} from '../../lib/constants';
import { MapProviderName } from '../LocationShare/services/mapProviders';
import ListPicker from './ListPicker';
import ApiKeyModal from './ApiKeyModal';
import { useTheme } from '../../theme';
import { useAppSelector } from '../../lib/hooks';

type TNavigation = CompositeNavigationProp<
	NativeStackNavigationProp<ProfileStackParamList, 'LocationPreferencesView'>,
	NativeStackNavigationProp<MasterDetailInsideStackParamList>
>;

const LocationPreferencesView = () => {
	const navigation = useNavigation<TNavigation>();
	const { colors } = useTheme();
	const userId = useAppSelector(state => state.login.user.id);

	const [mapProvider, setMapProvider] = useUserPreferences<MapProviderName>(`${MAP_PROVIDER_PREFERENCE_KEY}_${userId}`, MAP_PROVIDER_DEFAULT);
	const [googleApiKey, setGoogleApiKey] = useUserPreferences<string>(`${GOOGLE_MAPS_API_KEY_PREFERENCE_KEY}_${userId}`, '');
	const [osmApiKey, setOsmApiKey] = useUserPreferences<string>(`${OSM_API_KEY_PREFERENCE_KEY}_${userId}`, '');

	const [googleModalVisible, setGoogleModalVisible] = useState(false);
	const [osmModalVisible, setOsmModalVisible] = useState(false);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Location_Preferences')
		});
	}, [navigation]);

	const onProviderChange = (provider: MapProviderName) => {
		setMapProvider(provider);
	};

	const onGoogleApiKeyPress = () => {
		setGoogleModalVisible(true);
	};

	const onOsmApiKeyPress = () => {
		setOsmModalVisible(true);
	};

	const handleGoogleApiKeySave = (value: string) => {
		setGoogleApiKey(value);
		setGoogleModalVisible(false);
	};

	const handleOsmApiKeySave = (value: string) => {
		setOsmApiKey(value);
		setOsmModalVisible(false);
	};

	return (
		<SafeAreaView>
			<List.Container>
				{/* Pass translation KEYS to List components (they call I18n.t internally) */}
				<List.Section title='Map_Provider'>
					<List.Separator />
					<ListPicker
						title='Default_Map_Provider'
						value={mapProvider}
						onChangeValue={onProviderChange}
					/>
					<List.Separator />
					<List.Info info='Map_Provider_Info' />
				</List.Section>

				<List.Section title='API_Keys'>
					<List.Separator />
					<List.Item
						title='Google_Maps_API_Key'
						onPress={onGoogleApiKeyPress}
						right={() => (
							<Text style={[styles.apiKeyStatus, { color: colors.fontSecondaryInfo }]}>
								{googleApiKey ? I18n.t('Configured') : I18n.t('Not_configured')}
							</Text>
						)}
					/>
					<List.Separator />
					<List.Item
						title='OSM_API_Key'
						onPress={onOsmApiKeyPress}
						right={() => (
							<Text style={[styles.apiKeyStatus, { color: colors.fontSecondaryInfo }]}>
								{osmApiKey ? I18n.t('Configured') : I18n.t('Not_configured')}
							</Text>
						)}
					/>
					<List.Separator />
					<List.Info info='API_Keys_Info' />
				</List.Section>

				<List.Section title='How_to_get_API_keys'>
					<List.Separator />
					<List.Info info='Google_API_Key_Instructions' />
					<List.Info info='OSM_API_Key_Instructions' />
				</List.Section>
			</List.Container>

			<ApiKeyModal
				visible={googleModalVisible}
				title={I18n.t('Google_Maps_API_Key')}
				placeholder={I18n.t('Enter_your_Google_Maps_API_key')}
				initialValue={googleApiKey}
				onSave={handleGoogleApiKeySave}
				onCancel={() => setGoogleModalVisible(false)}
			/>

			<ApiKeyModal
				visible={osmModalVisible}
				title={I18n.t('OSM_API_Key')}
				placeholder={I18n.t('Enter_your_OSM_API_key')}
				initialValue={osmApiKey}
				onSave={handleOsmApiKeySave}
				onCancel={() => setOsmModalVisible(false)}
			/>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	apiKeyStatus: {
		fontSize: 14,
		fontWeight: '500'
	}
});

export default LocationPreferencesView;
