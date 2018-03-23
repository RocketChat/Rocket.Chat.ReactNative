import React from 'react';
import PropTypes from 'prop-types';
import { View, SectionList, Text, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { connect } from 'react-redux';

import styles from './styles';
import Avatar from '../../containers/Avatar';
import Touch from '../../utils/touch';
import database from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import { leaveRoom } from '../../actions/room';

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	user: state.login.user
}), dispatch => ({
	leaveRoom: rid => dispatch(leaveRoom(rid))
}))
export default class RoomActionsView extends React.PureComponent {
	static propTypes = {
		baseUrl: PropTypes.string,
		user: PropTypes.object,
		navigation: PropTypes.object,
		leaveRoom: PropTypes.func
	}

	constructor(props) {
		super(props);
		const { rid } = props.navigation.state.params;
		this.rooms = database.objects('subscriptions').filtered('rid = $0', rid);
		this.state = {
			sections: [],
			room: {},
			members: []
		};
	}

	async componentDidMount() {
		await this.updateRoom();
		this.updateRoomMembers();
		this.rooms.addListener(this.updateRoom);
	}

	componentWillUnmount() {
		this.rooms.removeAllListeners();
	}

	onPressTouchable = (item) => {
		if (item.route) {
			return this.props.navigation.navigate(item.route, item.params);
		}
		if (item.event) {
			return item.event();
		}
	}

	getRoomTitle = room => (room.t === 'd' ? room.fname : room.name);

	updateRoomMembers = async() => {
		let members;
		try {
			const membersResult = await RocketChat.getRoomMembers(this.state.room.rid, false);
			members = membersResult.records;
		} catch (error) {
			return;
		}
		this.setState({ members });
		this.updateSections();
	}

	updateRoom = async() => {
		const [room] = this.rooms;
		await this.setState({ room });
		this.updateSections();
	}

	updateSections = async() => {
		const { rid, t, blocked } = this.state.room;
		const { members } = this.state;
		const sections = [{
			data: [{ icon: 'ios-star', name: 'USER' }],
			renderItem: this.renderRoomInfo
		}, {
			data: [
				{ icon: 'ios-call-outline', name: 'Voice call' },
				{ icon: 'ios-videocam-outline', name: 'Video call' }
			],
			renderItem: this.renderItem
		}, {
			data: [
				{
					icon: 'ios-attach',
					name: 'Files',
					route: 'RoomFiles',
					params: { rid }
				},
				{
					icon: 'ios-at-outline',
					name: 'Mentions',
					route: 'MentionedMessages',
					params: { rid }
				},
				{
					icon: 'ios-star-outline',
					name: 'Starred',
					route: 'StarredMessages',
					params: { rid }
				},
				{ icon: 'ios-search', name: 'Search' },
				{ icon: 'ios-share-outline', name: 'Share' },
				{
					icon: 'ios-pin',
					name: 'Pinned',
					route: 'PinnedMessages',
					params: { rid }
				},
				{
					icon: 'ios-code',
					name: 'Snippets',
					route: 'SnippetedMessages',
					params: { rid }
				},
				{ icon: 'ios-notifications-outline', name: 'Notifications preferences' }
			],
			renderItem: this.renderItem
		}];
		if (t === 'd') {
			sections.push({
				data: [
					{ icon: 'ios-volume-off', name: 'Mute user' },
					{
						icon: 'block',
						name: `${ blocked ? 'Unblock' : 'Block' } user`,
						type: 'danger',
						event: () => this.toggleBlockUser()
					}
				],
				renderItem: this.renderItem
			});
		} else if (t === 'c' || t === 'p') {
			if (members.length > 0) {
				sections[2].data.unshift({
					icon: 'ios-people',
					name: 'Members',
					description: (members.length === 1 ? `${ members.length } member` : `${ members.length } members`),
					route: 'RoomMembers',
					params: { rid, members }
				});
			}
			sections.push({
				data: [
					{ icon: 'ios-volume-off', name: 'Mute channel' },
					{
						icon: 'block',
						name: 'Leave channel',
						type: 'danger',
						event: () => this.leaveChannel()
					}
				],
				renderItem: this.renderItem
			});
		}
		this.setState({ sections });
	}

	toggleBlockUser = () => {
		const { rid, blocked } = this.state.room;
		const { members } = this.state;
		const member = members.find(m => m.id !== this.props.user.id);
		RocketChat.toggleBlockUser(rid, member._id, !blocked);
	}

	leaveChannel = () => {
		const { room } = this.state;
		Alert.alert(
			'Are you sure?',
			`Are you sure you want to leave the room ${ this.getRoomTitle(room) }?`,
			[
				{
					text: 'Cancel',
					style: 'cancel'
				},
				{
					text: 'Yes, leave it!',
					style: 'destructive',
					onPress: async() => {
						this.props.leaveRoom(room.rid);
					}
				}
			]
		);
	}

	renderRoomInfo = ({ item }) => {
		const { room } = this.state;
		const { name, t, topic } = room;
		return (
			this.renderTouchableItem([
				<Avatar
					key='avatar'
					text={name}
					size={50}
					style={styles.avatar}
					baseUrl={this.props.baseUrl}
					type={t}
				/>,
				<View key='name' style={styles.roomTitleContainer}>
					<Text style={styles.roomTitle}>{ this.getRoomTitle(room) }</Text>
					<Text style={styles.roomDescription} ellipsizeMode='tail' numberOfLines={1}>{t === 'd' ? `@${ name }` : topic}</Text>
				</View>,
				<Icon key='icon' name='ios-arrow-forward' size={20} style={styles.sectionItemIcon} color='#cbced1' />
			], item)
		);
	}

	renderTouchableItem = (subview, item) => (
		<Touch
			onPress={() => this.onPressTouchable(item)}
			underlayColor='#FFFFFF'
			activeOpacity={0.5}
			accessibilityLabel={item.name}
			accessibilityTraits='button'
		>
			<View style={styles.sectionItem}>
				{subview}
			</View>
		</Touch>
	)

	renderItem = ({ item }) => {
		if (item.type === 'danger') {
			const subview = [
				<MaterialIcon key='icon' name={item.icon} size={20} style={[styles.sectionItemIcon, styles.textColorDanger]} />,
				<Text key='name' style={[styles.sectionItemName, styles.textColorDanger]}>{ item.name }</Text>
			];
			return this.renderTouchableItem(subview, item);
		}
		const subview = [
			<Icon key='left-icon' name={item.icon} size={24} style={styles.sectionItemIcon} />,
			<Text key='name' style={styles.sectionItemName}>{ item.name }</Text>,
			item.description && <Text key='description' style={styles.sectionItemDescription}>{ item.description }</Text>,
			<Icon key='right-icon' name='ios-arrow-forward' size={20} style={styles.sectionItemIcon} color='#cbced1' />
		];
		return this.renderTouchableItem(subview, item);
	}

	renderSectionSeparator = (data) => {
		if (!data.trailingItem) {
			if (!data.trailingSection) {
				return <View style={styles.sectionSeparatorBorder} />;
			}
			return null;
		}
		return (
			<View style={[styles.sectionSeparator, data.leadingSection && styles.sectionSeparatorBorder]} />
		);
	}

	render() {
		return (
			<SectionList
				style={styles.container}
				stickySectionHeadersEnabled={false}
				sections={this.state.sections}
				SectionSeparatorComponent={this.renderSectionSeparator}
				keyExtractor={(item, index) => index}
			/>
		);
	}
}
