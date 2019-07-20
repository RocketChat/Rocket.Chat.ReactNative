import React from 'react';
import {
	FlatList, StyleSheet, View
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import RNUserDefaults from 'rn-user-defaults';

import I18n from '../i18n';
import database from '../lib/realm';
import StatusBar from '../containers/StatusBar';
import { selectServerSuccess as selectServerSuccessAction } from '../actions/server';
import { setUser as setUserAction } from '../actions/login';
import { addSettings as addSettingsAction } from '../actions';
import {
	COLOR_BACKGROUND_CONTAINER
} from '../constants/colors';
import Navigation from '../lib/Navigation';
import ServerItem, { ROW_HEIGHT } from '../presentation/ServerItem';
import sharedStyles from './Styles';
import RocketChat from '../lib/rocketchat';

const getItemLayout = (data, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });
const keyExtractor = item => item.id;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	list: {
		marginVertical: 32,
		...sharedStyles.separatorVertical
	},
	separator: {
		...sharedStyles.separatorBottom,
		marginLeft: 48
	}
});

@connect(state => ({
	server: state.server.server
}), dispatch => ({
	setUser: user => dispatch(setUserAction(user)),
	addSettings: settings => dispatch(addSettingsAction(settings)),
	selectServerSuccess: server => dispatch(selectServerSuccessAction(server))
}))
export default class SelectServerView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Select_Server')
	})

	static propTypes = {
		server: PropTypes.string,
		setUser: PropTypes.func,
		addSettings: PropTypes.func,
		selectServerSuccess: PropTypes.func
	}

	constructor(props) {
		super(props);
		const { serversDB } = database.databases;
		const servers = serversDB.objects('servers');
		const filteredServers = servers.filter(server => server.roomsUpdatedAt);
		this.state = {
			servers: filteredServers
		};
	}

	select = async(server) => {
		const {
			server: currentServer, selectServerSuccess, setUser, addSettings
		} = this.props;

		if (currentServer !== server) {
			const { serversDB } = database.databases;

			// server
			database.setActiveDB(server);
			const serverInfo = serversDB.objectForPrimaryKey('servers', server);
			selectServerSuccess(server, serverInfo.version);

			// add settings to upload media
			addSettings({
				Site_Url: serverInfo.id,
				useRealName: serverInfo.useRealName,
				FileUpload_MediaTypeWhiteList: serverInfo.FileUpload_MediaTypeWhiteList,
				FileUpload_MaxFileSize: serverInfo.FileUpload_MaxFileSize
			});

			// user
			const userId = await RNUserDefaults.get(`${ RocketChat.TOKEN_KEY }-${ server }`);
			const user = userId && serversDB.objectForPrimaryKey('user', userId);
			setUser(user);
		}
		Navigation.navigate('ShareListView');
	}

	renderItem = ({ item }) => {
		const { server } = this.props;
		return (
			<ServerItem
				server={server}
				onPress={() => this.select(item.id)}
				item={item}
				hasCheck
			/>
		);
	}

	renderSeparator = () => <View style={styles.separator} />;

	render() {
		const { servers } = this.state;
		return (
			<SafeAreaView
				style={styles.container}
				forceInset={{ bottom: 'never' }}
			>
				<StatusBar />
				<View style={styles.list}>
					<FlatList
						data={servers}
						keyExtractor={keyExtractor}
						renderItem={this.renderItem}
						getItemLayout={getItemLayout}
						ItemSeparatorComponent={this.renderSeparator}
						enableEmptySections
						removeClippedSubviews
						keyboardShouldPersistTaps='always'
						windowSize={7}
						bounces={false}
					/>
				</View>
			</SafeAreaView>
		);
	}
}
