import React, { useEffect, useLayoutEffect } from 'react';
import { FlatList } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Q } from '@nozbe/watermelondb';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';

import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';
import ServerItem, { ROW_HEIGHT } from '../containers/ServerItem';
import database from '../lib/database';
import SafeAreaView from '../containers/SafeAreaView';
import * as List from '../containers/List';
import { ShareInsideStackParamList } from '../definitions/navigationTypes';
import { TServerModel } from '../definitions';
import { useAppSelector } from '../lib/hooks';
import { selectServerRequest } from '../actions/server';

const getItemLayout = (data: any, index: number) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });
const keyExtractor = (item: TServerModel) => item.id;

const SelectServerView = () => {
	const [servers, setServers] = React.useState<TServerModel[]>([]);
	const dispatch = useDispatch();

	const server = useAppSelector(state => state.server.server);
	const navigation = useNavigation<NativeStackNavigationProp<ShareInsideStackParamList, 'SelectServerView'>>();

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
			<StatusBar />
			<FlatList
				data={servers}
				renderItem={({ item }: { item: TServerModel }) => (
					<ServerItem onPress={() => select(item.id, item.version)} item={item} hasCheck={item.id === server} />
				)}
				keyExtractor={keyExtractor}
				getItemLayout={getItemLayout} // Refactor row_height
				ItemSeparatorComponent={List.Separator}
				contentContainerStyle={List.styles.contentContainerStyleFlatList}
				ListHeaderComponent={List.Separator}
				ListFooterComponent={List.Separator}
				removeClippedSubviews
				keyboardShouldPersistTaps='always'
			/>
		</SafeAreaView>
	);
};

export default SelectServerView;
