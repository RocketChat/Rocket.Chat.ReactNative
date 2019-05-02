import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, View, ScrollView, TouchableOpacity, Keyboard, Alert
} from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';

import { eraseRoom as eraseRoomAction } from '../../actions/room';
import LoggedView from '../View';
import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import styles from './styles';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { showErrorAlert, Toast } from '../../utils/info';
import database, { safeAddListener } from '../../lib/realm';
import RocketChat from '../../lib/rocketchat';
import RCTextInput from '../../containers/TextInput';
import Loading from '../../containers/Loading';
import SwitchContainer from './SwitchContainer';
import random from '../../utils/random';
import log from '../../utils/log';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';

const PERMISSION_SET_READONLY = 'set-readonly';
const PERMISSION_SET_REACT_WHEN_READONLY = 'set-react-when-readonly';
const PERMISSION_ARCHIVE = 'archive-room';
const PERMISSION_UNARCHIVE = 'unarchive-room';
const PERMISSION_DELETE_C = 'delete-c';
const PERMISSION_DELETE_P = 'delete-p';
const PERMISSIONS_ARRAY = [
	PERMISSION_SET_READONLY,
	PERMISSION_SET_REACT_WHEN_READONLY,
	PERMISSION_ARCHIVE,
	PERMISSION_UNARCHIVE,
	PERMISSION_DELETE_C,
	PERMISSION_DELETE_P
];

@connect(null, dispatch => ({
	eraseRoom: (rid, t) => dispatch(eraseRoomAction(rid, t))
}))
/** @extends React.Component */
export default class RoomInfoEditView extends LoggedView {
	static navigationOptions = {
		title: I18n.t('Room_Info_Edit')
	}

	static propTypes = {
		navigation: PropTypes.object,
		eraseRoom: PropTypes.func
	};

	constructor(props) {
		super('RoomInfoEditView', props);
		const rid = props.navigation.getParam('rid');
		this.rooms = database.objects('subscriptions').filtered('rid = $0', rid);
		this.permissions = {};
		this.state = {
			room: JSON.parse(JSON.stringify(this.rooms[0] || {})),
			name: '',
			description: '',
			topic: '',
			announcement: '',
			joinCode: '',
			nameError: {},
			saving: false,
			t: false,
			ro: false,
			reactWhenReadOnly: false
		};
	}


	componentDidMount() {
		this.updateRoom();
		this.init();
		safeAddListener(this.rooms, this.updateRoom);
		const { room } = this.state;
		this.permissions = RocketChat.hasPermission(PERMISSIONS_ARRAY, room.rid);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { room } = this.state;
		if (!equal(nextState, this.state)) {
			return true;
		}
		if (!equal(nextState.room, room)) {
			return true;
		}
		if (!equal(nextProps, this.props)) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		this.rooms.removeAllListeners();
	}

	updateRoom = () => {
		this.setState({ room: JSON.parse(JSON.stringify(this.rooms[0] || {})) });
	}

	init = () => {
		const { room } = this.state;
		const {
			name, description, topic, announcement, t, ro, reactWhenReadOnly, joinCodeRequired
		} = room;
		// fake password just to user knows about it
		this.randomValue = random(15);
		this.setState({
			name,
			description,
			topic,
			announcement,
			t: t === 'p',
			ro,
			reactWhenReadOnly,
			joinCode: joinCodeRequired ? this.randomValue : ''
		});
	}

	clearErrors = () => {
		this.setState({
			nameError: {}
		});
	}

	reset = () => {
		this.clearErrors();
		this.init();
	}

	formIsChanged = () => {
		const {
			room, name, description, topic, announcement, t, ro, reactWhenReadOnly, joinCode
		} = this.state;
		return !(room.name === name
			&& room.description === description
			&& room.topic === topic
			&& room.announcement === announcement
			&& this.randomValue === joinCode
			&& room.t === 'p' === t
			&& room.ro === ro
			&& room.reactWhenReadOnly === reactWhenReadOnly
		);
	}

	submit = async() => {
		Keyboard.dismiss();
		const {
			room, name, description, topic, announcement, t, ro, reactWhenReadOnly, joinCode
		} = this.state;

		this.setState({ saving: true });
		let error = false;

		if (!this.formIsChanged()) {
			showErrorAlert(I18n.t('Nothing_to_save'));
			return;
		}

		// Clear error objects
		await this.clearErrors();

		const params = {};

		// Name
		if (room.name !== name) {
			params.roomName = name;
		}
		// Description
		if (room.description !== description) {
			params.roomDescription = description;
		}
		// Topic
		if (room.topic !== topic) {
			params.roomTopic = topic;
		}
		// Announcement
		if (room.announcement !== announcement) {
			params.roomAnnouncement = announcement;
		}
		// Room Type
		if (room.t !== t) {
			params.roomType = t ? 'p' : 'c';
		}
		// Read Only
		if (room.ro !== ro) {
			params.readOnly = ro;
		}
		// React When Read Only
		if (room.reactWhenReadOnly !== reactWhenReadOnly) {
			params.reactWhenReadOnly = reactWhenReadOnly;
		}

		// Join Code
		if (this.randomValue !== joinCode) {
			params.joinCode = joinCode;
		}

		try {
			await RocketChat.saveRoomSettings(room.rid, params);
		} catch (e) {
			if (e.error === 'error-invalid-room-name') {
				this.setState({ nameError: e });
			}
			error = true;
			log('saveRoomSettings', e);
		}

		await this.setState({ saving: false });
		setTimeout(() => {
			if (error) {
				showErrorAlert(I18n.t('There_was_an_error_while_action', { action: I18n.t('saving_settings') }));
			} else {
				this.toast.show(I18n.t('Settings_succesfully_changed'));
			}
		}, 100);
	}

	delete = () => {
		const { room } = this.state;
		const { eraseRoom } = this.props;

		Alert.alert(
			I18n.t('Are_you_sure_question_mark'),
			I18n.t('Delete_Room_Warning'),
			[
				{
					text: I18n.t('Cancel'),
					style: 'cancel'
				},
				{
					text: I18n.t('Yes_action_it', { action: I18n.t('delete') }),
					style: 'destructive',
					onPress: () => eraseRoom(room.rid, room.t)
				}
			],
			{ cancelable: false }
		);
	}

	toggleArchive = () => {
		const { room } = this.state;
		const { rid, archived, t } = room;

		const action = I18n.t(`${ archived ? 'un' : '' }archive`);
		Alert.alert(
			I18n.t('Are_you_sure_question_mark'),
			I18n.t('Do_you_really_want_to_key_this_room_question_mark', { key: action }),
			[
				{
					text: I18n.t('Cancel'),
					style: 'cancel'
				},
				{
					text: I18n.t('Yes_action_it', { action }),
					style: 'destructive',
					onPress: async() => {
						try {
							await RocketChat.toggleArchiveRoom(rid, t, !archived);
						} catch (e) {
							log('toggleArchive', e);
						}
					}
				}
			],
			{ cancelable: false }
		);
	}

	hasDeletePermission = () => {
		const { room } = this.state;
		return (
			room.t === 'p' ? this.permissions[PERMISSION_DELETE_P] : this.permissions[PERMISSION_DELETE_C]
		);
	}

	hasArchivePermission = () => (
		this.permissions[PERMISSION_ARCHIVE] || this.permissions[PERMISSION_UNARCHIVE]
	);

	render() {
		const {
			name, nameError, description, topic, announcement, t, ro, reactWhenReadOnly, room, joinCode, saving
		} = this.state;
		return (
			<KeyboardView
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
			>
				<StatusBar />
				<ScrollView
					contentContainerStyle={sharedStyles.containerScrollView}
					testID='room-info-edit-view-list'
					{...scrollPersistTaps}
				>
					<SafeAreaView style={sharedStyles.container} testID='room-info-edit-view' forceInset={{ bottom: 'never' }}>
						<RCTextInput
							inputRef={(e) => { this.name = e; }}
							label={I18n.t('Name')}
							value={name}
							onChangeText={value => this.setState({ name: value })}
							onSubmitEditing={() => { this.description.focus(); }}
							error={nameError}
							testID='room-info-edit-view-name'
						/>
						<RCTextInput
							inputRef={(e) => { this.description = e; }}
							label={I18n.t('Description')}
							value={description}
							onChangeText={value => this.setState({ description: value })}
							onSubmitEditing={() => { this.topic.focus(); }}
							testID='room-info-edit-view-description'
						/>
						<RCTextInput
							inputRef={(e) => { this.topic = e; }}
							label={I18n.t('Topic')}
							value={topic}
							onChangeText={value => this.setState({ topic: value })}
							onSubmitEditing={() => { this.announcement.focus(); }}
							testID='room-info-edit-view-topic'
						/>
						<RCTextInput
							inputRef={(e) => { this.announcement = e; }}
							label={I18n.t('Announcement')}
							value={announcement}
							onChangeText={value => this.setState({ announcement: value })}
							onSubmitEditing={() => { this.joinCode.focus(); }}
							testID='room-info-edit-view-announcement'
						/>
						<RCTextInput
							inputRef={(e) => { this.joinCode = e; }}
							label={I18n.t('Password')}
							value={joinCode}
							onChangeText={value => this.setState({ joinCode: value })}
							onSubmitEditing={this.submit}
							secureTextEntry
							testID='room-info-edit-view-password'
						/>
						<SwitchContainer
							value={t}
							leftLabelPrimary={I18n.t('Public')}
							leftLabelSecondary={I18n.t('Everyone_can_access_this_channel')}
							rightLabelPrimary={I18n.t('Private')}
							rightLabelSecondary={I18n.t('Just_invited_people_can_access_this_channel')}
							onValueChange={value => this.setState({ t: value })}
							testID='room-info-edit-view-t'
						/>
						<SwitchContainer
							value={ro}
							leftLabelPrimary={I18n.t('Collaborative')}
							leftLabelSecondary={I18n.t('All_users_in_the_channel_can_write_new_messages')}
							rightLabelPrimary={I18n.t('Read_Only')}
							rightLabelSecondary={I18n.t('Only_authorized_users_can_write_new_messages')}
							onValueChange={value => this.setState({ ro: value })}
							disabled={!this.permissions[PERMISSION_SET_READONLY] || room.broadcast}
							testID='room-info-edit-view-ro'
						/>
						{ro && !room.broadcast
							? (
								<SwitchContainer
									value={reactWhenReadOnly}
									leftLabelPrimary={I18n.t('No_Reactions')}
									leftLabelSecondary={I18n.t('Reactions_are_disabled')}
									rightLabelPrimary={I18n.t('Allow_Reactions')}
									rightLabelSecondary={I18n.t('Reactions_are_enabled')}
									onValueChange={value => this.setState({ reactWhenReadOnly: value })}
									disabled={!this.permissions[PERMISSION_SET_REACT_WHEN_READONLY]}
									testID='room-info-edit-view-react-when-ro'
								/>
							)
							: null
						}
						{room.broadcast
							? [
								<Text style={styles.broadcast}>{I18n.t('Broadcast_Channel')}</Text>,
								<View style={styles.divider} />
							]
							: null
						}
						<TouchableOpacity
							style={[sharedStyles.buttonContainer, !this.formIsChanged() && styles.buttonContainerDisabled]}
							onPress={this.submit}
							disabled={!this.formIsChanged()}
							testID='room-info-edit-view-submit'
						>
							<Text style={sharedStyles.button} accessibilityTraits='button'>{I18n.t('SAVE')}</Text>
						</TouchableOpacity>
						<View style={{ flexDirection: 'row' }}>
							<TouchableOpacity
								style={[sharedStyles.buttonContainer_inverted, styles.buttonInverted, { flex: 1 }]}
								onPress={this.reset}
								testID='room-info-edit-view-reset'
							>
								<Text style={sharedStyles.button_inverted} accessibilityTraits='button'>{I18n.t('RESET')}</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[
									sharedStyles.buttonContainer_inverted,
									styles.buttonDanger,
									!this.hasArchivePermission() && sharedStyles.opacity5,
									{ flex: 1, marginLeft: 10 }
								]}
								onPress={this.toggleArchive}
								disabled={!this.hasArchivePermission()}
								testID='room-info-edit-view-archive'
							>
								<Text style={[sharedStyles.button_inverted, styles.colorDanger]} accessibilityTraits='button'>
									{ room.archived ? I18n.t('UNARCHIVE') : I18n.t('ARCHIVE') }
								</Text>
							</TouchableOpacity>
						</View>
						<View style={styles.divider} />
						<TouchableOpacity
							style={[
								sharedStyles.buttonContainer_inverted,
								sharedStyles.buttonContainerLastChild,
								styles.buttonDanger,
								!this.hasDeletePermission() && sharedStyles.opacity5
							]}
							onPress={this.delete}
							disabled={!this.hasDeletePermission()}
							testID='room-info-edit-view-delete'
						>
							<Text style={[sharedStyles.button_inverted, styles.colorDanger]} accessibilityTraits='button'>{I18n.t('DELETE')}</Text>
						</TouchableOpacity>
						<Loading visible={saving} />
						<Toast ref={toast => this.toast = toast} />
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}
