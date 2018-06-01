import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ScrollView, Text, View, StyleSheet, FlatList, TouchableHighlight } from 'react-native';
import { connect } from 'react-redux';
import { DrawerActions } from 'react-navigation';

import database from '../lib/realm';
import { setServer } from '../actions/server';
import { logout } from '../actions/login';
import I18n from '../i18n';

const styles = StyleSheet.create({
	scrollView: {
		paddingTop: 20
	},
	imageContainer: {
		width: '100%',
		alignItems: 'center'
	},
	image: {
		width: 200,
		height: 200,
		borderRadius: 100
	},
	serverTitle: {
		fontSize: 16,
		color: 'grey',
		padding: 10,
		width: '100%'
	},
	serverItem: {
		backgroundColor: 'white',
		padding: 10,
		flex: 1
	},
	selectedServer: {
		backgroundColor: '#eeeeee'
	}
});
const keyExtractor = item => item.id;
@connect(state => ({
	server: state.server.server
}), dispatch => ({
	selectServer: server => dispatch(setServer(server)),
	logout: () => dispatch(logout())
}))
export default class Sidebar extends Component {
	static propTypes = {
		server: PropTypes.string.isRequired,
		selectServer: PropTypes.func.isRequired,
		navigation: PropTypes.object.isRequired,
		logout: PropTypes.func.isRequired
	}

	constructor(props) {
		super(props);
		this.state = { servers: [] };
	}

	componentDidMount() {
		database.databases.serversDB.addListener('change', this.updateState);
		this.setState(this.getState());
	}

	componentWillUnmount() {
		database.databases.serversDB.removeListener('change', this.updateState);
	}

	onPressItem = (item) => {
		this.props.selectServer(item.id);
		this.closeDrawer();
	}

	getState = () => ({
		servers: database.databases.serversDB.objects('servers')
	})

	updateState = () => {
		this.setState(this.getState());
	}

	closeDrawer = () => {
		this.props.navigation.dispatch(DrawerActions.closeDrawer());
	}

	renderItem = ({ item, separators }) => (

		<TouchableHighlight
			onShowUnderlay={separators.highlight}
			onHideUnderlay={separators.unhighlight}
			onPress={() => { this.onPressItem(item); }}
			testID={`sidebar-${ item.id }`}
		>
			<View style={[styles.serverItem, (item.id === this.props.server ? styles.selectedServer : null)]}>
				<Text>
					{item.id}
				</Text>
			</View>
		</TouchableHighlight>
	);

	render() {
		return (
			<ScrollView style={styles.scrollView}>
				<View style={{ paddingBottom: 20 }} testID='sidebar'>
					<FlatList
						data={this.state.servers}
						renderItem={this.renderItem}
						keyExtractor={keyExtractor}
					/>
					<TouchableHighlight
						onPress={() => {
							this.closeDrawer();
							this.props.logout();
						}}
						testID='sidebar-logout'
					>
						<View style={styles.serverItem}>
							<Text>{I18n.t('Logout')}</Text>
						</View>
					</TouchableHighlight>
					<TouchableHighlight
						onPress={() => {
							this.closeDrawer();
							this.props.navigation.navigate({ key: 'AddServer', routeName: 'AddServer' });
						}}
						testID='sidebar-add-server'
					>
						<View style={styles.serverItem}>
							<Text>{I18n.t('Add_Server')}</Text>
						</View>
					</TouchableHighlight>
				</View>
			</ScrollView>
		);
	}
}
