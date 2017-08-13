import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, StyleSheet, Button } from 'react-native';
import { ListView } from 'realm/react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as actions from '../actions';
import realm from '../lib/realm';
import RocketChat from '../lib/rocketchat';
import debounce from '../utils/throttle';
import Message from '../components/Message';
import MessageBox from '../components/MessageBox';
// import KeyboardView from '../components/KeyboardView';
const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff'
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
	},
	header: {
		transform: [{ scaleY: -1 }],
		textAlign: 'center',
		padding: 5,
		color: '#ccc'
	}
});


@connect(state => ({
	server: state.server,
	Site_Url: state.settings.Site_Url
}), dispatch => ({
	actions: bindActionCreators(actions, dispatch)
}))
export default class RoomView extends React.Component {
	static propTypes = {
		navigator: PropTypes.object.isRequired,
		rid: PropTypes.string,
		sid: PropTypes.string,
		name: PropTypes.string,
		server: PropTypes.string,
		Site_Url: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.rid = props.rid || realm.objectForPrimaryKey('subscriptions', props.sid).rid;
		// this.rid = 'GENERAL';

		this.data = realm.objects('messages').filtered('_server.id = $0 AND rid = $1', this.props.server, this.rid).sorted('ts', true);
		this.state = {
			dataSource: ds.cloneWithRows(this.data.slice(0, 10)),
			loaded: true,
			joined: typeof props.rid === 'undefined'
		};

		this.props.navigator.setTitle({
			title: this.props.name || realm.objectForPrimaryKey('subscriptions', this.props.sid).name
		});
	}

	componentWillMount() {
		const late = setTimeout(() => this.setState({
			loaded: false
		}), 1000);
		RocketChat.loadMessagesForRoom(this.rid, null, () => {
			clearTimeout(late);
			this.setState({
				loaded: true
			});
			this.data.addListener(this.updateState);
		});
		this.updateState();
	}

	componentDidMount() {
		return RocketChat.readMessages(this.rid);
	}

	componentWillUnmount() {
		this.data.removeListener(this.updateState);
	}

	onEndReached = () => {
		const rowCount = this.state.dataSource.getRowCount();
		if (rowCount && this.state.loaded && this.state.loadingMore !== true && this.state.end !== true) {
			this.setState({
				// ...this.state,
				loadingMore: true
			});

			const lastRowData = this.data[rowCount - 1];
			RocketChat.loadMessagesForRoom(this.rid, lastRowData.ts, ({ end }) => {
				this.setState({
					// ...this.state,
					loadingMore: false,
					end
				});
			});
		}
	}

	updateState = debounce(() => {
		this.setState({
			dataSource: ds.cloneWithRows(this.data)
		});
		// RocketChat.readMessages(this.rid);
		// this.setState({
		// 	messages: this.messages
		// });
	}, 100);

	sendMessage = message => RocketChat.sendMessage(this.rid, message);

	joinRoom = () => {
		RocketChat.joinRoom(this.props.rid)
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
			baseUrl={this.props.Site_Url}
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
				ref={box => this.box = box}
				onSubmit={this.sendMessage}
				rid={this.rid}
			/>
		);
	}

	renderHeader = () => {
		if (this.state.loadingMore) {
			return <Text style={styles.header}>Loading more messages...</Text>;
		}

		if (this.state.end) {
			return <Text style={styles.header}>Start of conversation</Text>;
		}
	}

	render() {
		// data={this.state.dataSource}
		// extraData={this.state}
		// renderItem={this.renderItem}
		// keyExtractor={item => item._id}
		//
		return (
			<View style={styles.container}>
				{this.renderBanner()}
				<ListView
					enableEmptySections
					style={styles.list}
					onEndReachedThreshold={10}
					renderFooter={this.renderHeader}
					onEndReached={this.onEndReached}
					dataSource={this.state.dataSource}
					renderRow={item => this.renderItem({ item })}
				/>
				{this.renderFooter()}
			</View>
		);
	}
}
