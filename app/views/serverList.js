import React from 'react';
import PropTypes from 'prop-types';
import Zeroconf from 'react-native-zeroconf';
import { View, Text, SectionList, Button, StyleSheet } from 'react-native';

import realm from '../lib/realm';
import RocketChat from '../lib/rocketchat';

const styles = StyleSheet.create({
	view: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'stretch'
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

export default class ListServerView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object.isRequired
	}

	static navigationOptions = ({ navigation }) => ({
		title: 'Servers',
		headerRight: (
			<Button
				title='Add'
				onPress={() => navigation.navigate('NewServerModal')}
			/>
		)
	});

	constructor(props) {
		super(props);
		this.state = {
			sections: []
		};
	}

	componentWillMount() {
		realm.addListener('change', this.updateState);
		zeroconf.on('update', this.updateState);

		zeroconf.scan('http', 'tcp', 'local.');

		this.state = this.getState();
	}

	componentWillUnmount() {
		zeroconf.stop();
		realm.removeListener('change', this.updateState);
		zeroconf.removeListener('update', this.updateState);
	}

	onPressItem(item) {
		RocketChat.currentServer = item.id;

		RocketChat.connect();
		this.props.navigation.dispatch({ type: 'Navigation/BACK' });
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
