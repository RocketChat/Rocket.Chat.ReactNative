import React from 'react';
import {
	FlatList, Text, View
} from 'react-native';
import PropTypes from 'prop-types';
import * as Keychain from 'react-native-keychain';
import { connect } from 'react-redux';
import { HeaderBackButton, SafeAreaView } from 'react-navigation';
import FastImage from 'react-native-fast-image';
import { RectButton } from 'react-native-gesture-handler';

import I18n from '../i18n';
import database from '../lib/realm';
import { CustomIcon } from '../lib/Icons';
import StatusBar from '../containers/StatusBar';
import EventEmitter from '../utils/events';
import { selectServerRequest as selectServerRequestAction } from '../actions/server';

import {
	HEADER_BACK, COLOR_BACKGROUND_CONTAINER
} from '../constants/colors';
import Navigation from '../lib/Navigation';

const getItemLayout = (data, index) => ({ length: 70, offset: 70 * index, index });
const keyExtractor = item => item.id;

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

	renderItem = ({ item }) => {
		const { server } = this.props;
		return (
			<RectButton
				onPress={() => this.select(item.id)}
				style={{
					flexDirection: 'row',
					paddingHorizontal: 16,
					paddingVertical: 8,
					backgroundColor: 'white',
					alignItems: 'center'
				}}
			>
				<FastImage
					style={{ height: 50, width: 50 }}
					source={{
						uri: item.iconURL,
						priority: FastImage.priority.high
					}}
				/>
				<View style={{ marginLeft: 10, justifyContent: 'center' }}>
					<Text style={{ fontSize: 18, lineHeight: 24 }}>{item.name}</Text>
					<Text style={{ fontSize: 14 }}>{item.id}</Text>
				</View>
				{item.id === server ? <CustomIcon name='check' size={20} style={{ position: 'absolute', right: 16 }} /> : null}
			</RectButton>
		);
	}

	renderList = () => {
		const { serversDB } = database.databases;
		const servers = serversDB.objects('servers');

		if (servers && servers.length > 0) {
			return (
				<FlatList
					data={servers}
					keyExtractor={keyExtractor}
					style={{ width: '100%', flex: 1, paddingVertical: 32 }}
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
				style={{ flex: 1, backgroundColor: COLOR_BACKGROUND_CONTAINER }}
				forceInset={{ bottom: 'never' }}
			>
				<StatusBar />
				{this.renderList()}
			</SafeAreaView>
		);
	}
}
