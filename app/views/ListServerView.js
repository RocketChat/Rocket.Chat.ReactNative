import React from 'react';

import Icon from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
// import Zeroconf from 'react-native-zeroconf';
import { View, Text, SectionList, StyleSheet, SafeAreaView } from 'react-native';
import { connect } from 'react-redux';
import { withNavigationFocus } from 'react-navigation';

import LoggedView from './View';
import { setServer } from '../actions/server';
import database from '../lib/realm';
import Fade from '../animations/fade';
import Touch from '../utils/touch';

const styles = StyleSheet.create({
	view: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'stretch',
		backgroundColor: '#fff'
	},
	input: {
		height: 40,
		borderColor: '#aaa',
		margin: 20,
		padding: 5,
		borderWidth: 0,
		backgroundColor: '#f8f8f8'
	},
	text: {
		textAlign: 'center',
		color: '#888'
	},
	container: {
		flex: 1
	},
	separator: {
		height: 1,
		backgroundColor: '#eee'
	},
	headerStyle: {
		backgroundColor: '#eee',
		lineHeight: 24,
		paddingLeft: 14,
		color: '#888'
	},
	serverItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		padding: 14
	},
	listItem: {
		color: '#666',
		flexGrow: 1,
		lineHeight: 30
	},
	serverChecked: {
		flexGrow: 0
	}
});

// const zeroconf = new Zeroconf();


@connect(state => ({
	server: state.server.server,
	login: state.login,
	connected: state.meteor.connected
}), dispatch => ({
	selectServer: server => dispatch(setServer(server))
}))
class ListServerView extends LoggedView {
	static propTypes = {
		navigation: PropTypes.object.isRequired,
		login: PropTypes.object.isRequired,
		selectServer: PropTypes.func.isRequired,
		connected: PropTypes.bool.isRequired,
		server: PropTypes.string
	}

	constructor(props) {
		super('ListServerView', props);
		this.state = {
			sections: []
		};
		this.data = database.databases.serversDB.objects('servers');
		// this.redirected = false;
		this.data.addListener(this.updateState);
	}

	componentDidMount() {
		// zeroconf.on('update', this.updateState);
		// zeroconf.scan('http', 'tcp', 'local.');
		this.updateState();
		this.jumpToSelectedServer();
	}

	// componentDidUpdate() {
	// 	if (this.props.connected &&
	// 		this.props.server &&
	// 		!this.props.login.token &&
	// 		!this.redirected) {
	// 		this.redirected = true;
	// 		this.props.navigation.navigate({ key: 'LoginSignup', routeName: 'LoginSignup' });
	// 	} else if (!this.props.connected) {
	// 		this.redirected = false;
	// 	}
	// }

	componentWillUnmount() {
		// zeroconf.stop();
		this.data.removeAllListeners();
		// zeroconf.removeListener('update', this.updateState);
	}

	openLogin = () => {
		this.props.navigation.navigate({ key: 'LoginSignup', routeName: 'LoginSignup' });
	}

	selectAndNavigateTo = (server) => {
		this.props.selectServer(server);
		this.openLogin();
	}

	jumpToSelectedServer() {
		if (this.props.server && !this.props.login.isRegistering) {
			setTimeout(() => {
				if (this.props.isFocused) {
					this.openLogin();
				}
			}, 500);
		}
	}

	onPressItem = (item) => {
		this.selectAndNavigateTo(item.id);
	}

	getState = () => {
		const sections = [{
			title: 'My servers',
			data: this.data
		}];
		//
		// this.state.nearBy = zeroconf.getServices();
		// if (this.state.nearBy) {
		// 	const nearBy = Object.keys(this.state.nearBy)
		// 		.filter(key => this.state.nearBy[key].addresses);
		// 	if (nearBy.length) {
		// 		sections.push({
		// 			title: 'Nearby',
		// 			data: nearBy.map((key) => {
		// 				const server = this.state.nearBy[key];
		// 				const address = `http://${ server.addresses[0] }:${ server.port }`;
		// 				return {
		// 					id: address
		// 				};
		// 			})
		// 		});
		// 	}
		// }

		return {
			...this.state,
			sections
		};
	};

	updateState = () => {
		this.setState(this.getState());
	}

	renderItem = ({ item }) => (
		<Touch
			underlayColor='#ccc'
			accessibilityTraits='button'
			onPress={() => { this.onPressItem(item); }}
		>
			<View style={styles.serverItem}>
				<Text
					style={[styles.listItem]}
					adjustsFontSizeToFit
				>
					{item.id}
				</Text>
				<Fade visible={this.props.server === item.id}>
					<Icon
						iconSize={24}
						size={24}
						style={styles.serverChecked}
						name='ios-checkmark-circle-outline'
					/>
				</Fade>
			</View>
		</Touch>
	);


	renderSectionHeader = ({ section }) => (
		<Text style={styles.headerStyle}>{section.title}</Text>
	);

	renderSeparator = () => (
		<View style={styles.separator} />
	);

	render() {
		return (
			<SafeAreaView style={styles.view} testID='list-server-view'>
				<SectionList
					style={styles.list}
					sections={this.state.sections}
					renderItem={this.renderItem}
					renderSectionHeader={this.renderSectionHeader}
					keyExtractor={item => item.id}
					ItemSeparatorComponent={this.renderSeparator}
				/>
			</SafeAreaView>
		);
	}
}
export default withNavigationFocus(ListServerView);
