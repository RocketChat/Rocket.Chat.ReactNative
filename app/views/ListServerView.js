import React from 'react';

import Icon from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import { View, Text, SectionList, StyleSheet } from 'react-native';
import { connect } from 'react-redux';

import LoggedView from './View';
import { selectServer } from '../actions/server';
import database from '../lib/realm';
import Fade from '../animations/fade';
import Touch from '../utils/touch';
import I18n from '../i18n';
import { iconsMap } from '../Icons';

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

@connect(state => ({
	server: state.server.server,
	login: state.login,
	connected: state.meteor.connected
}), dispatch => ({
	selectServer: server => dispatch(selectServer(server))
}))
/** @extends React.Component */
export default class ListServerView extends LoggedView {
	static propTypes = {
		navigator: PropTypes.object,
		login: PropTypes.object.isRequired,
		selectServer: PropTypes.func.isRequired,
		server: PropTypes.string
	}

	constructor(props) {
		super('ListServerView', props);
		this.state = {
			sections: []
		};
		this.data = database.databases.serversDB.objects('servers');
		this.data.addListener(this.updateState);
		props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
	}

	async componentWillMount() {
		this.props.navigator.setButtons({
			rightButtons: [{
				id: 'addServer',
				icon: iconsMap.add
			}]
		});
	}

	componentDidMount() {
		this.updateState();
		this.jumpToSelectedServer();
	}

	componentWillUnmount() {
		this.data.removeAllListeners();
	}

	onNavigatorEvent(event) {
		if (event.type === 'NavBarButtonPress') {
			if (event.id === 'addServer') {
				this.props.navigator.push({
					screen: 'NewServerView',
					title: I18n.t('New_Server')
				});
			}
		}
	}

	onPressItem = (item) => {
		this.selectAndNavigateTo(item.id);
	}

	getState = () => {
		const sections = [{
			title: I18n.t('My_servers'),
			data: this.data
		}];

		return {
			...this.state,
			sections
		};
	};

	openLogin = (server) => {
		this.props.navigator.push({
			screen: 'LoginSignupView',
			title: server
		});
	}

	selectAndNavigateTo = (server) => {
		this.props.selectServer(server);
		this.openLogin(server);
	}

	jumpToSelectedServer() {
		if (this.props.server && !this.props.login.isRegistering) {
			setTimeout(() => {
				this.openLogin(this.props.server);
			}, 1000);
		}
	}

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
			<View style={styles.view} testID='list-server-view'>
				<SectionList
					style={styles.list}
					sections={this.state.sections}
					renderItem={this.renderItem}
					renderSectionHeader={this.renderSectionHeader}
					keyExtractor={item => item.id}
					ItemSeparatorComponent={this.renderSeparator}
				/>
			</View>
		);
	}
}
