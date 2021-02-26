import React from 'react';
import { FlatList } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Q } from '@nozbe/watermelondb';

import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';
import ServerItem, { ROW_HEIGHT } from '../presentation/ServerItem';
import RocketChat from '../lib/rocketchat';
import database from '../lib/database';
import SafeAreaView from '../containers/SafeAreaView';
import * as List from '../containers/List';

const getItemLayout = (data, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });
const keyExtractor = item => item.id;

class SelectServerView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Select_Server')
	})

	static propTypes = {
		server: PropTypes.string,
		navigation: PropTypes.object
	}

	state = { servers: [] };

	async componentDidMount() {
		const serversDB = database.servers;
		const serversCollection = serversDB.get('servers');
		const servers = await serversCollection.query(Q.where('rooms_updated_at', Q.notEq(null))).fetch();
		this.setState({ servers });
	}

	select = async(server) => {
		const {
			server: currentServer, navigation
		} = this.props;

		navigation.navigate('ShareListView');
		if (currentServer !== server) {
			await RocketChat.shareExtensionInit(server);
		}
	}

	renderItem = ({ item }) => {
		const { server } = this.props;
		return (
			<ServerItem
				onPress={() => this.select(item.id)}
				item={item}
				hasCheck={item.id === server}
			/>
		);
	}

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
					enableEmptySections
					removeClippedSubviews
					keyboardShouldPersistTaps='always'
				/>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = (({ share }) => ({
	server: share.server.server
}));

export default connect(mapStateToProps)(SelectServerView);
