import React from 'react';
import {
	FlatList, View, StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';
import * as Keychain from 'react-native-keychain';
import { connect } from 'react-redux';
import { HeaderBackButton, SafeAreaView } from 'react-navigation';

import I18n from '../i18n';
import database from '../lib/realm';
import StatusBar from '../containers/StatusBar';
import EventEmitter from '../utils/events';
import { selectServerRequest as selectServerRequestAction } from '../actions/server';

import {
	HEADER_BACK, COLOR_BACKGROUND_CONTAINER, COLOR_WHITE
} from '../constants/colors';
import Navigation from '../lib/Navigation';
import ServerItem from '../presentation/ServerItem';

const getItemLayout = (data, index) => ({ length: 68, offset: 68 * index, index });
const keyExtractor = item => item.id;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	list: {
		width: '100%',
		flex: 1,
		paddingVertical: 32
	},
	server: {
		backgroundColor: COLOR_WHITE
	}
});

@connect(state => ({
	server: state.server.server
}), dispatch => ({
	selectServerRequest: server => dispatch(selectServerRequestAction(server))
}))
export default class LoginView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: (
			<HeaderBackButton
				title={I18n.t('Back')}
				backTitleVisible
				onPress={navigation.goBack}
				tintColor={HEADER_BACK}
			/>
		),
		title: I18n.t('Select_Server')
	})

	static propTypes = {
		server: PropTypes.string,
		selectServerRequest: PropTypes.func
	}

	select = async(server) => {
		const {
			server: currentServer, selectServerRequest
		} = this.props;

		if (currentServer !== server) {
			const { password: token } = await Keychain.getInternetCredentials(server, { accessGroup: 'group.chat.rocket.reactnative', service: 'chat.rocket.reactnative' });
			if (!token) {
				this.newServerTimeout = setTimeout(() => {
					EventEmitter.emit('NewServer', { server });
				}, 1000);
			} else {
				selectServerRequest(server);
				Navigation.navigate('ShareListView');
			}
		}
	}

	renderItem = ({ item }) => (
		<View style={styles.server}>
			<ServerItem
				onPress={() => this.select(item.id)}
				item={item}
				hasCheck
			/>
		</View>
	);

	renderList = () => {
		const { serversDB } = database.databases;
		const servers = serversDB.objects('servers');

		if (servers && servers.length > 0) {
			return (
				<FlatList
					data={servers}
					keyExtractor={keyExtractor}
					style={styles.list}
					renderItem={this.renderItem}
					getItemLayout={getItemLayout}
					enableEmptySections
					removeClippedSubviews
					keyboardShouldPersistTaps='always'
					initialNumToRender={12}
					windowSize={7}
				/>
			);
		}
		return null;
	}

	render() {
		return (
			<SafeAreaView
				style={styles.container}
				forceInset={{ bottom: 'never' }}
			>
				<StatusBar />
				{this.renderList()}
			</SafeAreaView>
		);
	}
}
