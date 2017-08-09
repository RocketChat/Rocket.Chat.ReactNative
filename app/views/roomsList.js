import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, FlatList, StyleSheet } from 'react-native';
import Meteor from 'react-native-meteor';
import realm from '../lib/realm';
import RocketChat, { connect } from '../lib/meteor';

import RoomItem from '../components/RoomItem';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'stretch',
		justifyContent: 'center'
	},
	separator: {
		height: 1,
		backgroundColor: '#CED0CE'
	},
	list: {
		width: '100%'
	},
	emptyText: {
		textAlign: 'center',
		fontSize: 18,
		color: '#ccc'
	},
	bannerContainer: {
		backgroundColor: '#ddd'
	},
	bannerText: {
		lineHeight: 28,
		textAlign: 'center'
	}
});

let navigation;

Meteor.getData().on('loggingIn', () => {
	setTimeout(() => {
		if (Meteor._isLoggingIn === false && Meteor.userId() == null) {
			console.log('loggingIn', Meteor.userId());
			navigation.navigate('Login');
		}
	}, 100);
});

Meteor.Accounts.onLogin(() => {
	console.log('onLogin');
});

export default class RoomsListView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object.isRequired
	}

	static navigationOptions = () => ({
		title: 'Rooms'
	});

	constructor(props) {
		super(props);

		this.state = this.getState();
	}

	componentWillMount() {
		realm.addListener('change', this.updateState);

		navigation = this.props.navigation;

		if (RocketChat.currentServer) {
			connect(() => {
				// navigation.navigate('Login');
			});
		} else {
			navigation.navigate('ListServerModal');
		}
	}

	componentWillUnmount() {
		realm.removeListener('change', this.updateState);
	}

	getState = () => ({
		dataSource: realm.objects('subscriptions').filtered('_server.id = $0', RocketChat.currentServer).sorted('name').slice()
			.sort((a, b) => {
				if (a.unread < b.unread) {
					return 1;
				}

				if (a.unread > b.unread) {
					return -1;
				}

				return 0;
			})
	})

	updateState = () => {
		this.setState(this.getState());
	}

	_onPressItem = (id) => {
		const { navigate } = this.props.navigation;
		navigate('Room', { sid: id });
	}

	renderBanner = () => {
		if (Meteor.getData().ddp.status !== 'connected') {
			return (
				<View style={styles.bannerContainer}>
					<Text style={styles.bannerText}>Connecting...</Text>
				</View>
			);
		}

		if (Meteor._isLoggingIn) {
			return (
				<View style={styles.bannerContainer}>
					<Text style={styles.bannerText}>Loggining...</Text>
				</View>
			)
		}
	}

	renderItem = ({ item }) => (
		<RoomItem
			id={item._id}
			onPressItem={this._onPressItem}
			item={item}
		/>
	);

	renderSeparator = () => (
		<View style={styles.separator} />
	);

	renderList = () => {
		if (this.state.dataSource.length) {
			return (
				<FlatList
					style={styles.list}
					data={this.state.dataSource}
					renderItem={this.renderItem}
					keyExtractor={item => item._id}
					ItemSeparatorComponent={this.renderSeparator}
				/>
			);
		}

		return (
			<Text style={styles.emptyText}>No rooms</Text>
		);
	}

	render() {
		return (
			<View style={styles.container}>
				{this.renderBanner()}
				{this.renderList()}
			</View>
		);
	}
}
