import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, ScrollView } from 'react-native';
import { connect } from 'react-redux';

import Status from '../../containers/status';
import Avatar from '../../containers/Avatar';
import styles from './styles';
import sharedStyles from '../Styles';
import database from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	user: state.login.user
}))
export default class RoomInfoView extends React.Component {
	static propTypes = {
		baseUrl: PropTypes.string,
		user: PropTypes.object,
		navigation: PropTypes.object
	}

	constructor(props) {
		super(props);
		const { rid } = props.navigation.state.params;
		this.rooms = database.objects('subscriptions').filtered('rid = $0', rid);
		this.state = {
			room: {},
			roomUser: {}
		};
	}

	async componentDidMount() {
		await this.updateRoom();
		this.rooms.addListener(this.updateRoom);

		// get user of room
		if (this.state.room.t === 'd') {
			try {
				const roomUser = await RocketChat.getRoomMember(this.state.room.rid, this.props.user.id);
				this.setState({ roomUser });
			} catch (error) {
				console.warn(error);
			}
		}
	}

	componentWillUnmount() {
		this.rooms.removeAllListeners();
	}

	getRoomTitle = room => (room.t === 'd' ? room.fname : room.name);

	updateRoom = async() => {
		const [room] = this.rooms;
		this.setState({ room });
	}

	renderItem = (key, room) => (
		<View style={styles.item}>
			<Text style={styles.itemLabel}>{key}</Text>
			<Text style={styles.itemContent}>{ room[key] }</Text>
		</View>
	);

	render() {
		const { room, roomUser } = this.state;
		const { name, t } = room;
		return (
			<ScrollView style={styles.container}>
				<View style={styles.avatarContainer}>
					<Avatar
						text={name}
						size={100}
						style={styles.avatar}
						baseUrl={this.props.baseUrl}
						type={t}
					>
						{t === 'd' ? <Status style={[sharedStyles.status, styles.status]} id={roomUser._id} /> : null}
					</Avatar>
					<Text style={styles.roomTitle}>{ this.getRoomTitle(room) }</Text>
				</View>
				{this.renderItem('description', room)}
				{this.renderItem('topic', room)}
				{this.renderItem('announcement', room)}
			</ScrollView>
		);
	}
}
