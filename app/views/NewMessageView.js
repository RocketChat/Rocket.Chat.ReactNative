import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, SafeAreaView, FlatList, Text, Platform, Image, ScrollView } from 'react-native';

import database from '../lib/realm';
import RocketChat from '../lib/rocketchat';
import UserItem from '../presentation/UserItem';
import debounce from '../utils/debounce';
import LoggedView from './View';
import I18n from '../i18n';
import Touch from '../utils/touch';
import SearchBox from '../containers/SearchBox';

const styles = StyleSheet.create({
	safeAreaView: {
		flex: 1,
		backgroundColor: Platform.OS === 'ios' ? '#F7F8FA' : '#E1E5E8'
	},
	list: {
		width: '100%',
		backgroundColor: '#fff'
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: '#CBCED1',
		marginLeft: 60
	},
	borderVertical: {
		borderTopWidth: StyleSheet.hairlineWidth,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: '#CBCED1'
	},
	createChannelButton: {
		marginVertical: 25
	},
	createChannelContainer: {
		height: 47,
		backgroundColor: '#fff',
		flexDirection: 'row',
		alignItems: 'center'
	},
	createChannelIcon: {
		width: 24,
		height: 24,
		marginHorizontal: 18
	},
	createChannelText: {
		color: '#1D74F5',
		fontSize: 18
	}
});

/** @extends React.Component */
export default class SelectedUsersView extends LoggedView {
	static navigatorButtons = {
		leftButtons: [{
			id: 'cancel',
			title: I18n.t('Cancel')
		}]
	}

	static propTypes = {
		navigator: PropTypes.object,
		onPressItem: PropTypes.func.isRequired
	};

	constructor(props) {
		super('NewMessageView', props);
		this.data = database.objects('subscriptions').filtered('t = $0', 'd').sorted('roomUpdatedAt', true);
		this.state = {
			search: []
		};
		this.data.addListener(this.updateState);
		props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
	}

	componentWillUnmount() {
		this.updateState.stop();
		this.data.removeAllListeners();
	}

	async onNavigatorEvent(event) {
		if (event.type === 'NavBarButtonPress') {
			if (event.id === 'cancel') {
				this.props.navigator.dismissModal();
			}
		}
	}

	onSearchChangeText(text) {
		this.search(text);
	}

	onPressItem = (item) => {
		this.props.navigator.dismissModal();
		setTimeout(() => {
			this.props.onPressItem(item);
		}, 600);
	}

	updateState = debounce(() => {
		this.forceUpdate();
	}, 1000);

	async search(text) {
		const searchText = text.trim();
		if (searchText === '') {
			delete this.oldPromise;
			return this.setState({
				search: []
			});
		}

		let data = this.data.filtered('name CONTAINS[c] $0 AND t = $1', searchText, 'd').slice(0, 7);

		const usernames = data.map(sub => sub.map);
		try {
			if (data.length < 7) {
				if (this.oldPromise) {
					this.oldPromise('cancel');
				}

				const { users } = await Promise.race([
					RocketChat.spotlight(searchText, usernames, { users: true, rooms: false }),
					new Promise((resolve, reject) => this.oldPromise = reject)
				]);

				data = users.map(user => ({
					...user,
					rid: user.username,
					name: user.username,
					t: 'd',
					search: true
				}));

				delete this.oldPromise;
			}
			this.setState({
				search: data
			});
		} catch (e) {
			// alert(JSON.stringify(e));
		}
	}

	createChannel = () => {
		this.props.navigator.push({
			screen: 'SelectedUsersView',
			title: I18n.t('Select_Users'),
			backButtonTitle: '',
			passProps: {
				nextAction: 'CREATE_CHANNEL'
			}
		});
	}

	renderSeparator = () => <View style={styles.separator} />;

	renderItem = ({ item }) => (
		<UserItem
			name={item.search ? item.name : item.fname}
			username={item.search ? item.username : item.name}
			onPress={() => this.onPressItem(item)}
			testID={`new-message-view-item-${ item.name }`}
		/>
	)

	renderList = () => (
		<FlatList
			data={this.state.search.length > 0 ? this.state.search : this.data}
			extraData={this.state.search.length > 0 ? this.state.search : this.data}
			keyExtractor={item => item._id}
			style={[styles.list, styles.borderVertical]}
			renderItem={this.renderItem}
			ItemSeparatorComponent={this.renderSeparator}
			keyboardShouldPersistTaps='always'
		/>
	)

	render = () => (
		<SafeAreaView style={styles.safeAreaView} testID='new-message-view'>
			<ScrollView keyboardShouldPersistTaps='always'>
				<SearchBox onChangeText={text => this.onSearchChangeText(text)} />
				<Touch onPress={this.createChannel} style={styles.createChannelButton}>
					<View style={[styles.borderVertical, styles.createChannelContainer]}>
						<Image style={styles.createChannelIcon} source={{ uri: 'plus' }} />
						<Text style={styles.createChannelText}>{I18n.t('Create_Channel')}</Text>
					</View>
				</Touch>
				{this.renderList()}
			</ScrollView>
		</SafeAreaView>
	);
}
