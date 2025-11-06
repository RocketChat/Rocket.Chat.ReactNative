import React, { useLayoutEffect } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

import * as List from '../../containers/List';
import I18n from '../../i18n';
import SafeAreaView from '../../containers/SafeAreaView';
import type { ProfileStackParamList } from '../../stacks/types';
import type { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import { useUserPreferences } from '../../lib/methods/userPreferences';
import { MAP_PROVIDER_PREFERENCE_KEY, MAP_PROVIDER_DEFAULT } from '../../lib/constants/keys';
import type { MapProviderName } from '../LocationShare/services/mapProviders';
import ListPicker from './ListPicker';
import { useAppSelector } from '../../lib/hooks/useAppSelector';

type TNavigation = CompositeNavigationProp<
	NativeStackNavigationProp<ProfileStackParamList, 'LocationPreferencesView'>,
	NativeStackNavigationProp<MasterDetailInsideStackParamList>
>;

const LocationPreferencesView = () => {
	const navigation = useNavigation<TNavigation>();
	const userId = useAppSelector(state => state.login.user.id);

	const [mapProvider, setMapProvider] = useUserPreferences<MapProviderName>(
		`${MAP_PROVIDER_PREFERENCE_KEY}_${userId}`,
		MAP_PROVIDER_DEFAULT
	);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Location_Preferences')
		});
	}, [navigation]);

	const onProviderChange = (provider: MapProviderName) => {
		setMapProvider(provider);
	};

	return (
		<SafeAreaView>
			<List.Container>
				<List.Section title='Map_Provider'>
					<List.Separator />
					<ListPicker title='Default_Map_Provider' value={mapProvider} onChangeValue={onProviderChange} />
					<List.Separator />
					<List.Info info='Map_Provider_Info' />
				</List.Section>
			</List.Container>
		</SafeAreaView>
	);
};

export default LocationPreferencesView;
