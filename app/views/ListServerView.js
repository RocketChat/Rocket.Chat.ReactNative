import React from 'react';

import Icon from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import { View, Text, SectionList, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import { Navigation } from 'react-native-navigation';

import LoggedView from './View';
import { selectServer } from '../actions/server';
import database from '../lib/realm';
import Fade from '../animations/fade';
import Touch from '../utils/touch';
import I18n from '../i18n';

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

/** @extends React.Component */
class ListServerView extends LoggedView {
	static propTypes = {
		componentId: PropTypes.any,
		login: PropTypes.object.isRequired,
		selectServer: PropTypes.func.isRequired,
		server: PropTypes.string
	}

	// eslint-disable-next-line react/sort-comp
	static get options() {
		return {
			topBar: {
				title: {
					text: 'Servers'
				},
				rightButtons: [
					{
						id: 'AddServer',
						title: 'Add',
						icon: require('../static/images/navicon_add.png') // eslint-disable-line
					}
				]
			}
		};
	}

	constructor(props) {
		super('ListServerView', props);
		this.state = {
			sections: []
		};
		this.data = database.databases.serversDB.objects('servers');
		this.data.addListener(this.updateState);
	}

	componentDidMount() {
		this.updateState();
		this.jumpToSelectedServer();
	}

	componentWillUnmount() {
		this.data.removeAllListeners();
	}

	onNavigationButtonPressed() {
		Navigation.push(this.props.componentId, {
			component: {
				name: 'NewServerView'
			}
		});
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

	openLogin = () => {
		Navigation.push(this.props.componentId, {
			component: {
				name: 'LoginSignupView'
			}
		});
	}

	selectAndNavigateTo = (server) => {
		this.props.selectServer(server);
		this.openLogin();
	}

	jumpToSelectedServer() {
		if (this.props.server && !this.props.login.isRegistering) {
			setTimeout(() => {
				this.openLogin();
			}, 500);
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

const mapStateToProps = state => ({
	server: state.server.server,
	login: state.login,
	connected: state.meteor.connected
});

const mapDispatchToProps = dispatch => ({
	selectServer: server => dispatch(selectServer(server))
});

export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(ListServerView);
