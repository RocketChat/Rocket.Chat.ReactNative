import React, { useEffect, useLayoutEffect } from 'react';
import { FlatList } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Q } from '@nozbe/watermelondb';
import { useNavigation } from '@react-navigation/native';

import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';
import ServerItem, { ROW_HEIGHT } from '../containers/ServerItem';
import { shareExtensionInit } from '../lib/methods/shareExtension';
import database from '../lib/database';
import SafeAreaView from '../containers/SafeAreaView';
import * as List from '../containers/List';
import { ShareInsideStackParamList } from '../definitions/navigationTypes';
import { TServerModel } from '../definitions';
import { useAppSelector } from '../lib/hooks';

const getItemLayout = (data: any, index: number) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });
const keyExtractor = (item: TServerModel) => item.id;

const SelectServerView = () => {
	const [servers, setServers] = React.useState<TServerModel[]>([]);

	const server = useAppSelector(state => state.share.server.server);
	const navigation = useNavigation<StackNavigationProp<ShareInsideStackParamList, 'SelectServerView'>>();

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

	const select = async (serverSelected: string) => {
		navigation.navigate('ShareListView');
		if (serverSelected !== server) {
			await shareExtensionInit(serverSelected);
		}
	};

	return (
		<SafeAreaView>
			<StatusBar />
			<FlatList
				data={servers}
				renderItem={({ item }: { item: TServerModel }) => (
					<ServerItem onPress={() => select(item.id)} item={item} hasCheck={item.id === server} />
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
