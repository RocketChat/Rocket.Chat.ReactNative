import React from 'react';
import PropTypes from 'prop-types';
import { View, SectionList, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { connect } from 'react-redux';

import styles from './styles';
import Avatar from '../../containers/Avatar';
import Touch from '../../utils/touch';
import database from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
}))
export default class RoomActionsView extends React.PureComponent {
	static propTypes = {
		baseUrl: PropTypes.string,
		navigation: PropTypes.object
	}

	constructor(props) {
		super(props);
		const { rid } = props.navigation.state.params;
		this.rooms = database.objects('subscriptions').filtered('rid = $0', rid);
		this.state = {
			sections: [],
			room: {}
		};
	}

	componentDidMount() {
		this.updateRoom();
		this.updateSections();
		this.rooms.addListener(this.updateRoom);
	}

	updateRoom = () => {
		const [room] = this.rooms;
		this.setState({ room });
		this.updateSections();
	}

	updateSections = async() => {
		const { rid, t } = this.state.room;
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
				{ icon: 'ios-attach', name: 'Files' },
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
				{ icon: 'ios-code', name: 'Snippets' },
				{ icon: 'ios-notifications-outline', name: 'Notifications preferences' }
			],
			renderItem: this.renderItem
		}];
		if (t === 'd') {
			sections.push({
				data: [
					{ icon: 'ios-volume-off', name: 'Mute user' },
					{ icon: 'block', name: 'Block user', type: 'danger' }
				],
				renderItem: this.renderItem
			});
		} else if (t === 'c' || t === 'p') {
			const membersResult = await RocketChat.getRoomMembers(rid, false);
			const members = membersResult.records;

			sections[2].data.unshift({
				icon: 'ios-people',
				name: 'Members',
				description: (members.length === 1 ? `${ members.length } member` : `${ members.length } members`),
				route: 'RoomMembers',
				params: { rid, members }
			});
			sections.push({
				data: [
					{ icon: 'ios-volume-off', name: 'Mute channel' },
					{ icon: 'block', name: 'Leave channel', type: 'danger' }
				],
				renderItem: this.renderItem
			});
		}
		this.setState({ sections });
	}

	renderRoomInfo = ({ item }) => {
		const {
			fname, name, t, topic
		} = this.state.room;
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
					<Text style={styles.roomTitle}>{t === 'd' ? fname : name}</Text>
					<Text style={styles.roomDescription} ellipsizeMode='tail' numberOfLines={1}>{t === 'd' ? `@${ name }` : topic}</Text>
				</View>,
				<Icon key='icon' name='ios-arrow-forward' size={20} style={styles.sectionItemIcon} color='#cbced1' />
			], item)
		);
	}

	renderTouchableItem = (subview, item) => (
		<Touch
			onPress={() => item.route && this.props.navigation.navigate(item.route, item.params)}
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
