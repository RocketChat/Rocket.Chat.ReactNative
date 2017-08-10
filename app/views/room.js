import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, FlatList, StyleSheet, Button } from 'react-native';
import realm from '../lib/realm';
import RocketChat from '../lib/rocketchat';

import Message from '../components/Message';
import MessageBox from '../components/MessageBox';
import KeyboardView from '../components/KeyboardView';

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	list: {
		flex: 1,
		transform: [{ scaleY: -1 }]
	},
	separator: {
		height: 1,
		backgroundColor: '#CED0CE'
	},
	bannerContainer: {
		backgroundColor: 'orange'
	},
	bannerText: {
		margin: 5,
		textAlign: 'center',
		color: '#a00'
	}
});

export default class RoomView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object.isRequired
	}

	static navigationOptions = ({ navigation }) => ({
		title: navigation.state.params.name || realm.objectForPrimaryKey('subscriptions', navigation.state.params.sid).name
	});

	constructor(props) {
		super(props);
		this.rid = props.navigation.state.params.rid || realm.objectForPrimaryKey('subscriptions', props.navigation.state.params.sid).rid;
		// this.rid = 'GENERAL';

		this.state = {
			dataSource: this.getMessages(),
			loaded: true,
			joined: typeof props.navigation.state.params.rid === 'undefined'
		};

		this.url = realm.objectForPrimaryKey('settings', 'Site_Url').value;
	}

	componentWillMount() {
		const late = setTimeout(() => this.setState({
			loaded: false
		}), 1000);
		RocketChat.loadMessagesForRoom(this.rid, () => {
			clearTimeout(late);
			this.setState({
				loaded: true
			});
		});
		realm.addListener('change', this.updateState);
	}

	componentWillUnmount() {
		realm.removeListener('change', this.updateState);
	}

	getMessages = () => realm.objects('messages').filtered('_server.id = $0 AND rid = $1', RocketChat.currentServer, this.rid).sorted('ts', true)

	updateState = () => {
		this.setState({
			...this.state,
			dataSource: this.getMessages()
		});
	};

	sendMessage = message => RocketChat.sendMessage(this.rid, message);

	joinRoom = () => {
		RocketChat.joinRoom(this.props.navigation.state.params.rid)
			.then(() => {
				this.setState({
					joined: true
				});
			});
	};

	renderBanner = () => {
		if (this.state.loaded === false) {
			return (
				<View style={styles.bannerContainer}>
					<Text style={styles.bannerText}>Loading new messages...</Text>
				</View>
			);
		}
	};

	renderItem = ({ item }) => (
		<Message
			id={item._id}
			item={item}
			baseUrl={this.url}
		/>
	);

	renderSeparator = () => (
		<View style={styles.separator} />
	);

	renderFooter = () => {
		if (!this.state.joined) {
			return (
				<View>
					<Text>You are in preview mode.</Text>
					<Button title='Join' onPress={this.joinRoom} />
				</View>
			);
		}
		return (
			<MessageBox
				onSubmit={this.sendMessage}
			/>
		);
	}

	render() {
		return (
			<KeyboardView style={styles.container} keyboardVerticalOffset={64}>
				{this.renderBanner()}
				<FlatList
					ref={ref => this.listView = ref}
					style={styles.list}
					data={this.state.dataSource}
					extraData={this.state}
					renderItem={this.renderItem}
					keyExtractor={item => item._id}
				/>
				{this.renderFooter()}
			</KeyboardView>
		);
	}
}
