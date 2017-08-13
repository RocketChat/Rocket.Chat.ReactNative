import React from 'react';
import PropTypes from 'prop-types';
import { Navigation } from 'react-native-navigation';
import { bindActionCreators } from 'redux';
import Zeroconf from 'react-native-zeroconf';
import { View, Text, SectionList, Platform, StyleSheet } from 'react-native';
import { connect } from 'react-redux';

import * as actions from '../actions';
import realm from '../lib/realm';

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
	listItem: {
		lineHeight: 18,
		color: '#666',
		padding: 14
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
	}
});

const zeroconf = new Zeroconf();


@connect(state => ({
	server: state.server
}), dispatch => ({
	actions: bindActionCreators(actions, dispatch)
}))
export default class ListServerView extends React.Component {
	static propTypes = {
		navigator: PropTypes.object.isRequired,
		actions: PropTypes.object,
		server: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			sections: []
		};

		this.props.navigator.setTitle({
			title: 'Servers'
		});

		this.props.navigator.setButtons({
			rightButtons: [{
				id: 'add',
				title: 'Add'
			}],
			leftButtons: props.server && Platform.select({
				ios: [{
					id: 'close',
					title: 'Close'
				}]
			}),
			animated: true
		});

		this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
	}

	componentWillMount() {
		realm.addListener('change', this.updateState);
		zeroconf.on('update', this.updateState);

		zeroconf.scan('http', 'tcp', 'local.');

		this.state = this.getState();

		this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
	}

	componentWillUnmount() {
		zeroconf.stop();
		realm.removeListener('change', this.updateState);
		zeroconf.removeListener('update', this.updateState);
	}

	onNavigatorEvent = (event) => {
		if (event.type === 'NavBarButtonPress') {
			if (event.id === 'add') {
				Navigation.showModal({
					screen: 'NewServer',
					animationType: 'slide-up'
					// animationType: 'none'
				});
			}
			if (event.id === 'close') {
				Navigation.dismissModal({
					animationType: 'slide-down'
				});
			}
		}

		if (event.id === 'didDisappear' && this.state.server) {
			this.props.actions.setCurrentServer(this.state.server);
		}
	}

	onPressItem = (item) => {
		Navigation.dismissModal({
			animationType: 'slide-down'
		});

		this.setState({
			server: item.id
		});
	}

	getState = () => {
		const sections = [{
			title: 'My servers',
			data: realm.objects('servers')
		}];

		this.state.nearBy = zeroconf.getServices();
		if (this.state.nearBy) {
			const nearBy = Object.keys(this.state.nearBy)
				.filter(key => this.state.nearBy[key].addresses);
			if (nearBy.length) {
				sections.push({
					title: 'Nearby',
					data: nearBy.map((key) => {
						const server = this.state.nearBy[key];
						const address = `http://${ server.addresses[0] }:${ server.port }`;
						return {
							id: address
						};
					})
				});
			}
		}

		return {
			...this.state,
			sections
		};
	};

	updateState = () => {
		this.setState(this.getState());
	}

	renderItem = ({ item }) => (
		<Text
			style={styles.listItem}
			onPress={() => { this.onPressItem(item); }}
		>
			{item.id}
		</Text>
	);

	renderSectionHeader = ({ section }) => (
		<Text style={styles.headerStyle}>{section.title}</Text>
	);

	renderSeparator = () => (
		<View style={styles.separator} />
	);

	render() {
		return (
			<View style={styles.view}>
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
