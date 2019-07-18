import React from 'react';
import {
	FlatList, StyleSheet, View
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';

import I18n from '../i18n';
import database from '../lib/realm';
import StatusBar from '../containers/StatusBar';
import { selectServerRequest as selectServerRequestAction } from '../actions/server';

import {
	COLOR_BACKGROUND_CONTAINER
} from '../constants/colors';
import Navigation from '../lib/Navigation';
import ServerItem, { ROW_HEIGHT } from '../presentation/ServerItem';
import sharedStyles from './Styles';

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
	selectServerRequest: server => dispatch(selectServerRequestAction(server))
}))
export default class SelectServerView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Select_Server')
	})

	static propTypes = {
		server: PropTypes.string,
		selectServerRequest: PropTypes.func
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

	select = (server) => {
		const {
			server: currentServer, selectServerRequest
		} = this.props;

		if (currentServer !== server) {
			selectServerRequest(server);
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
