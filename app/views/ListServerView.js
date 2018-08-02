import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import { View, Text, SectionList, StyleSheet, SafeAreaView } from 'react-native';
import { connect } from 'react-redux';

import LoggedView from './View';
import { selectServerRequest } from '../actions/server';
import database from '../lib/realm';
import Fade from '../animations/fade';
import Touch from '../utils/touch';
import I18n from '../i18n';
import { iconsMap } from '../Icons';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff'
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
	selectServerRequest: server => dispatch(selectServerRequest(server))
}))
/** @extends React.Component */
export default class ListServerView extends LoggedView {
	static propTypes = {
		navigator: PropTypes.object,
		login: PropTypes.object.isRequired,
		selectServerRequest: PropTypes.func.isRequired,
		server: PropTypes.string
	}

	constructor(props) {
		super('ListServerView', props);
		this.focused = true;
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

	componentWillReceiveProps(nextProps) {
		if (this.props.server !== nextProps.server && nextProps.server && !this.props.login.isRegistering) {
			this.timeout = setTimeout(() => {
				this.openLogin(nextProps.server);
			}, 1000);
		}
	}

	componentWillUnmount() {
		this.data.removeAllListeners();
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	onNavigatorEvent(event) {
		if (event.type === 'NavBarButtonPress') {
			if (event.id === 'addServer') {
				this.props.navigator.push({
					screen: 'NewServerView',
					title: I18n.t('New_Server')
				});
			}
		} else if (event.type === 'ScreenChangedEvent') {
			this.focused = event.id === 'didAppear' || event.id === 'onActivityResumed';
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
		if (this.focused) {
			this.props.navigator.push({
				screen: 'LoginSignupView',
				title: server
			});
		}
	}

	selectAndNavigateTo = (server) => {
		this.props.selectServerRequest(server);
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
			<SafeAreaView style={styles.container} testID='list-server-view'>
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
