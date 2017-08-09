import React from 'react';
import PropTypes from 'prop-types';
import Zeroconf from 'react-native-zeroconf';
import { View, Text, SectionList, Button, StyleSheet } from 'react-native';

import realm from '../lib/realm';
import { connect } from '../lib/meteor';

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
		borderTopWidth: 2,
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
				onPress={() => navigation.navigate('NewServer')}
			/>
		)
	});

	constructor(props) {
		super(props);
		this.state = {
			sections: []
		};
	}

	componentDidMount() {
		const getState = () => {
			const sections = [{
				title: 'My servers',
				data: realm.objects('servers')
			}];

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

		const { navigation } = this.props;

		if (navigation && navigation.state.params && navigation.state.params.newServer) {
			return navigation.navigate('Login');
		}

		const currentServer = realm.objects('servers').filtered('current = true')[0];
		if (currentServer) {
			connect(() => {
				navigation.navigate('Login');
			});
		}

		zeroconf.on('update', () => {
			this.state.nearBy = zeroconf.getServices();
			this.setState(getState());
		});
		zeroconf.scan('http', 'tcp', 'local.');

		realm.addListener('change', () => this.setState(getState()));

		this.state = getState();

		return null;
	}

	onPressItem(item) {
		const { navigate } = this.props.navigation;
		realm.write(() => {
			realm.objects('servers').filtered('current = true').forEach(server => (server.current = false));
			realm.create('servers', { id: item.id, current: true }, true);
		});

		connect(() => {
			navigate('Login');
		});
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
