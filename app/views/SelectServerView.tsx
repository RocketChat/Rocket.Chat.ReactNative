import React from 'react';
import { FlatList } from 'react-native';
import { StackNavigationOptions, StackNavigationProp } from '@react-navigation/stack';
import { connect } from 'react-redux';
import { Q, Model } from '@nozbe/watermelondb';

import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';
import ServerItem, { ROW_HEIGHT } from '../presentation/ServerItem';
import { shareExtensionInit } from '../lib/rocketchat/services/shareExtension';
import database from '../lib/database';
import SafeAreaView from '../containers/SafeAreaView';
import * as List from '../containers/List';
import { ShareInsideStackParamList } from '../definitions/navigationTypes';

const getItemLayout = (data: any, index: number) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });
const keyExtractor = (item: IServer) => item.id;

interface IServer extends Model {
	id: string;
	iconURL: string;
	name: string;
}

interface ISelectServerViewState {
	servers: IServer[];
}

interface ISelectServerViewProps {
	navigation: StackNavigationProp<ShareInsideStackParamList, 'SelectServerView'>;
	server: string;
}

class SelectServerView extends React.Component<ISelectServerViewProps, ISelectServerViewState> {
	static navigationOptions = (): StackNavigationOptions => ({
		title: I18n.t('Select_Server')
	});

	state = { servers: [] as IServer[] };

	async componentDidMount() {
		const serversDB = database.servers;
		const serversCollection = serversDB.get('servers');
		const servers = (await serversCollection.query(Q.where('rooms_updated_at', Q.notEq(null))).fetch()) as IServer[];
		this.setState({ servers });
	}

	select = async (server: string) => {
		const { server: currentServer, navigation } = this.props;

		navigation.navigate('ShareListView');
		if (currentServer !== server) {
			await shareExtensionInit(server);
		}
	};

	renderItem = ({ item }: { item: IServer }) => {
		const { server } = this.props;
		return <ServerItem onPress={() => this.select(item.id)} item={item} hasCheck={item.id === server} />;
	};

	render() {
		const { servers } = this.state;
		return (
			<SafeAreaView>
				<StatusBar />
				<FlatList
					data={servers}
					keyExtractor={keyExtractor}
					renderItem={this.renderItem}
					getItemLayout={getItemLayout} // Refactor row_height
					contentContainerStyle={List.styles.contentContainerStyleFlatList}
					ItemSeparatorComponent={List.Separator}
					ListHeaderComponent={List.Separator}
					ListFooterComponent={List.Separator}
					removeClippedSubviews
					keyboardShouldPersistTaps='always'
				/>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = ({ share }: any) => ({
	server: share.server.server
});

export default connect(mapStateToProps)(SelectServerView);
