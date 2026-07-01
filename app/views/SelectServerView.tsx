import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, PixelRatio, StyleSheet } from 'react-native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Q } from '@nozbe/watermelondb';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import I18n from '../i18n';
import ServerItem, { ROW_HEIGHT } from '../containers/ServerItem';
import database from '../lib/database';
import SafeAreaView from '../containers/SafeAreaView';
import * as List from '../containers/List';
import { type ShareInsideStackParamList } from '../definitions/navigationTypes';
import { type TServerModel } from '../definitions';
import { useAppSelector } from '../lib/hooks/useAppSelector';
import { selectServerRequest } from '../actions/server';
import { useResponsiveLayout } from '../lib/hooks/useResponsiveLayout/useResponsiveLayout';

const keyExtractor = (item: TServerModel) => item.id;

const SelectServerView = () => {
	const [servers, setServers] = useState<TServerModel[]>([]);
	const dispatch = useDispatch();
	const { bottom } = useSafeAreaInsets();

	const server = useAppSelector(state => state.server.server);
	const navigation = useNavigation<NativeStackNavigationProp<ShareInsideStackParamList, 'SelectServerView'>>();
	const { fontScale } = useResponsiveLayout();

	const getItemLayout = useCallback(
		(_data: any, index: number) => {
			const height = PixelRatio.roundToNearestPixel(ROW_HEIGHT * fontScale);
			return { length: height, offset: (height + StyleSheet.hairlineWidth) * index, index };
		},
		[fontScale]
	);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Select_Server')
		});
	}, [navigation]);

	useEffect(() => {
		const init = async () => {
			const serversDB = database.servers;
			const serversCollection = serversDB.get('servers');
			const serversResult = await serversCollection.query(Q.where('rooms_updated_at', Q.notEq(null))).fetch();
			setServers(serversResult);
		};
		init();
	}, []);

	const select = (serverSelected: string, version: string) => {
		if (serverSelected !== server) {
			dispatch(selectServerRequest(serverSelected, version));
		}
		navigation.pop();
	};

	return (
		<SafeAreaView testID='select-server-view'>
			<FlatList
				data={servers}
				renderItem={({ item }: { item: TServerModel }) => (
					<ServerItem onPress={() => select(item.id, item.version)} item={item} hasCheck={item.id === server} />
				)}
				keyExtractor={keyExtractor}
				getItemLayout={getItemLayout}
				ItemSeparatorComponent={List.Separator}
				contentContainerStyle={[List.styles.contentContainerStyleFlatList, { paddingBottom: Math.max(16, bottom) }]}
				ListHeaderComponent={List.Separator}
				ListFooterComponent={List.Separator}
				removeClippedSubviews
				keyboardShouldPersistTaps='always'
			/>
		</SafeAreaView>
	);
};

export default SelectServerView;
