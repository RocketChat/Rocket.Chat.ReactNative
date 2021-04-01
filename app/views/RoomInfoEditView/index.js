import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, View, ScrollView, TouchableOpacity, Keyboard, Alert
} from 'react-native';
import { connect } from 'react-redux';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';
import ImagePicker from 'react-native-image-crop-picker';
import { dequal } from 'dequal';
import isEmpty from 'lodash/isEmpty';
import { compareServerVersion, methods } from '../../lib/utils';

import database from '../../lib/database';
import { deleteRoom as deleteRoomAction } from '../../actions/room';
import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import styles from './styles';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { showErrorAlert } from '../../utils/info';
import { LISTENER } from '../../containers/Toast';
import EventEmitter from '../../utils/events';
import RocketChat from '../../lib/rocketchat';
import RCTextInput from '../../containers/TextInput';
import Loading from '../../containers/Loading';
import SwitchContainer from './SwitchContainer';
import random from '../../utils/random';
import log, { logEvent, events } from '../../utils/log';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { MultiSelect } from '../../containers/UIKit/MultiSelect';
import { MessageTypeValues } from '../../utils/messageTypes';
import SafeAreaView from '../../containers/SafeAreaView';
import Avatar from '../../containers/Avatar';
import { CustomIcon } from '../../lib/Icons';

const PERMISSION_SET_READONLY = 'set-readonly';
const PERMISSION_SET_REACT_WHEN_READONLY = 'set-react-when-readonly';
const PERMISSION_ARCHIVE = 'archive-room';
const PERMISSION_UNARCHIVE = 'unarchive-room';
const PERMISSION_DELETE_C = 'delete-c';
const PERMISSION_DELETE_P = 'delete-p';

class RoomInfoEditView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Room_Info_Edit')
	})

	static propTypes = {
		route: PropTypes.object,
		deleteRoom: PropTypes.func,
		serverVersion: PropTypes.string,
		encryptionEnabled: PropTypes.bool,
		theme: PropTypes.string,
		setReadOnlyPermission: PropTypes.array,
		setReactWhenReadOnlyPermission: PropTypes.array,
		archiveRoomPermission: PropTypes.array,
		unarchiveRoomPermission: PropTypes.array,
		deleteCPermission: PropTypes.array,
		deletePPermission: PropTypes.array
	};

	constructor(props) {
		super(props);
		this.state = {
			room: {},
			avatar: {},
			permissions: {},
			name: '',
			description: '',
			topic: '',
			announcement: '',
			joinCode: '',
			nameError: {},
			saving: false,
			t: false,
			ro: false,
			reactWhenReadOnly: false,
			archived: false,
			systemMessages: [],
			enableSysMes: false,
			encrypted: false
		};
		this.loadRoom();
	}

	componentWillUnmount() {
		if (this.querySubscription && this.querySubscription.unsubscribe) {
			this.querySubscription.unsubscribe();
		}
	}

	// eslint-disable-next-line react/sort-comp
	loadRoom = async() => {
		const {
			route,
			setReadOnlyPermission,
			setReactWhenReadOnlyPermission,
			archiveRoomPermission,
			unarchiveRoomPermission,
			deleteCPermission,
			deletePPermission
		} = this.props;
		const rid = route.params?.rid;
		if (!rid) {
			return;
		}
		try {
			const db = database.active;
			const sub = await db.get('subscriptions').find(rid);
			const observable = sub.observe();

			this.querySubscription = observable.subscribe((data) => {
				this.room = data;
				this.init(this.room);
			});

			const result = await RocketChat.hasPermission([
				setReadOnlyPermission,
				setReactWhenReadOnlyPermission,
				archiveRoomPermission,
				unarchiveRoomPermission,
				deleteCPermission,
				deletePPermission
			], rid);

			this.setState({
				permissions: {
					[PERMISSION_SET_READONLY]: result[0],
					[PERMISSION_SET_REACT_WHEN_READONLY]: result[1],
					[PERMISSION_ARCHIVE]: result[2],
					[PERMISSION_UNARCHIVE]: result[3],
					[PERMISSION_DELETE_C]: result[4],
					[PERMISSION_DELETE_P]: result[5]
				}
			});
		} catch (e) {
			log(e);
		}
	}

	init = (room) => {
		const {
			description, topic, announcement, t, ro, reactWhenReadOnly, joinCodeRequired, sysMes, encrypted
		} = room;
		// fake password just to user knows about it
		this.randomValue = random(15);
		this.setState({
			room,
			name: RocketChat.getRoomTitle(room),
			description,
			topic,
			announcement,
			t: t === 'p',
			avatar: {},
			ro,
			reactWhenReadOnly,
			joinCode: joinCodeRequired ? this.randomValue : '',
			archived: room.archived,
			systemMessages: sysMes,
			enableSysMes: sysMes && sysMes.length > 0,
			encrypted
		});
	}

	clearErrors = () => {
		this.setState({
			nameError: {}
		});
	}

	reset = () => {
		logEvent(events.RI_EDIT_RESET);
		this.clearErrors();
		this.init(this.room);
	}

	formIsChanged = () => {
		const {
			room, name, description, topic, announcement, t, ro, reactWhenReadOnly, joinCode, systemMessages, enableSysMes, encrypted, avatar
		} = this.state;
		const { joinCodeRequired } = room;
		return !(room.name === name
			&& room.description === description
			&& room.topic === topic
			&& room.announcement === announcement
			&& (joinCodeRequired ? this.randomValue : '') === joinCode
			&& room.t === 'p' === t
			&& room.ro === ro
			&& room.reactWhenReadOnly === reactWhenReadOnly
			&& dequal(room.sysMes, systemMessages)
			&& enableSysMes === (room.sysMes && room.sysMes.length > 0)
			&& room.encrypted === encrypted
			&& isEmpty(avatar)
		);
	}

	submit = async() => {
		logEvent(events.RI_EDIT_SAVE);
		Keyboard.dismiss();
		const {
			room, name, description, topic, announcement, t, ro, reactWhenReadOnly, joinCode, systemMessages, encrypted, avatar
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
		// Avatar
		if (!isEmpty(avatar)) {
			params.roomAvatar = avatar.data;
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

		if (!dequal(room.sysMes, systemMessages)) {
			params.systemMessages = systemMessages;
		}

		// Join Code
		if (this.randomValue !== joinCode) {
			params.joinCode = joinCode;
		}

		// Encrypted
		if (room.encrypted !== encrypted) {
			params.encrypted = encrypted;
		}

		try {
			await RocketChat.saveRoomSettings(room.rid, params);
		} catch (e) {
			if (e.error === 'error-invalid-room-name') {
				this.setState({ nameError: e });
			}
			error = true;
			log(e);
		}

		await this.setState({ saving: false });
		setTimeout(() => {
			if (error) {
				logEvent(events.RI_EDIT_SAVE_F);
				showErrorAlert(I18n.t('There_was_an_error_while_action', { action: I18n.t('saving_settings') }));
			} else {
				EventEmitter.emit(LISTENER, { message: I18n.t('Settings_succesfully_changed') });
			}
		}, 100);
	}

	delete = () => {
		const { room } = this.state;
		const { deleteRoom } = this.props;

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
					onPress: () => deleteRoom(room.rid, room.t)
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
							logEvent(events.RI_EDIT_TOGGLE_ARCHIVE);
							await RocketChat.toggleArchiveRoom(rid, t, !archived);
						} catch (e) {
							logEvent(events.RI_EDIT_TOGGLE_ARCHIVE_F);
							log(e);
						}
					}
				}
			],
			{ cancelable: false }
		);
	}

	hasDeletePermission = () => {
		const { room, permissions } = this.state;
		return (
			room.t === 'p' ? permissions[PERMISSION_DELETE_P] : permissions[PERMISSION_DELETE_C]
		);
	}

	hasArchivePermission = () => {
		const { permissions } = this.state;
		return (permissions[PERMISSION_ARCHIVE] || permissions[PERMISSION_UNARCHIVE]);
	};

	renderSystemMessages = () => {
		const { systemMessages, enableSysMes } = this.state;
		const { theme } = this.props;

		if (!enableSysMes) {
			return null;
		}

		return (
			<MultiSelect
				options={MessageTypeValues.map(m => ({ value: m.value, text: { text: I18n.t('Hide_type_messages', { type: I18n.t(m.text) }) } }))}
				onChange={({ value }) => this.setState({ systemMessages: value })}
				placeholder={{ text: I18n.t('Hide_System_Messages') }}
				value={systemMessages}
				context={BLOCK_CONTEXT.FORM}
				multiselect
				theme={theme}
			/>
		);
	}

	changeAvatar = async() => {
		const options = {
			cropping: true,
			compressImageQuality: 0.8,
			cropperAvoidEmptySpaceAroundImage: false,
			cropperChooseText: I18n.t('Choose'),
			cropperCancelText: I18n.t('Cancel'),
			includeBase64: true
		};

		try {
			const response = await ImagePicker.openPicker(options);
			this.setState({ avatar: { url: response.path, data: `data:image/jpeg;base64,${ response.data }`, service: 'upload' } });
		} catch (e) {
			console.log(e);
		}
	}

	resetAvatar = () => {
		this.setState({ avatar: { data: null } });
	}

	toggleRoomType = (value) => {
		logEvent(events.RI_EDIT_TOGGLE_ROOM_TYPE);
		this.setState(({ encrypted }) => ({ t: value, encrypted: value && encrypted }));
	}

	toggleReadOnly = (value) => {
		logEvent(events.RI_EDIT_TOGGLE_READ_ONLY);
		this.setState({ ro: value });
	}

	toggleReactions = (value) => {
		logEvent(events.RI_EDIT_TOGGLE_REACTIONS);
		this.setState({ reactWhenReadOnly: value });
	}

	toggleHideSystemMessages = (value) => {
		logEvent(events.RI_EDIT_TOGGLE_SYSTEM_MSG);
		this.setState(({ systemMessages }) => ({ enableSysMes: value, systemMessages: value ? systemMessages : [] }));
	}

	toggleEncrypted = (value) => {
		logEvent(events.RI_EDIT_TOGGLE_ENCRYPTED);
		this.setState({ encrypted: value });
	}

	render() {
		const {
			name, nameError, description, topic, announcement, t, ro, reactWhenReadOnly, room, joinCode, saving, permissions, archived, enableSysMes, encrypted, avatar
		} = this.state;
		const { serverVersion, encryptionEnabled, theme } = this.props;
		const { dangerColor } = themes[theme];

		return (
			<KeyboardView
				style={{ backgroundColor: themes[theme].backgroundColor }}
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
			>
				<StatusBar />
				<SafeAreaView
					testID='room-info-edit-view'
					style={{ backgroundColor: themes[theme].backgroundColor }}
				>
					<ScrollView
						contentContainerStyle={sharedStyles.containerScrollView}
						testID='room-info-edit-view-list'
						{...scrollPersistTaps}
					>
						<TouchableOpacity
							style={styles.avatarContainer}
							onPress={this.changeAvatar}
							disabled={compareServerVersion(serverVersion, '3.6.0', methods.lowerThan)}
						>
							<Avatar
								type={room.t}
								text={room.name}
								avatar={avatar?.url}
								isStatic={avatar?.url}
								rid={isEmpty(avatar) && room.rid}
								size={100}
							>
								{compareServerVersion(serverVersion, '3.6.0', methods.lowerThan)
									? null
									: (
										<TouchableOpacity style={[styles.resetButton, { backgroundColor: themes[theme].dangerColor }]} onPress={this.resetAvatar}>
											<CustomIcon name='delete' color={themes[theme].backgroundColor} size={24} />
										</TouchableOpacity>
									)
								}
							</Avatar>
						</TouchableOpacity>
						<RCTextInput
							inputRef={(e) => { this.name = e; }}
							label={I18n.t('Name')}
							value={name}
							onChangeText={value => this.setState({ name: value })}
							onSubmitEditing={() => { this.description.focus(); }}
							error={nameError}
							theme={theme}
							testID='room-info-edit-view-name'
						/>
						<RCTextInput
							inputRef={(e) => { this.description = e; }}
							label={I18n.t('Description')}
							value={description}
							onChangeText={value => this.setState({ description: value })}
							onSubmitEditing={() => { this.topic.focus(); }}
							theme={theme}
							testID='room-info-edit-view-description'
						/>
						<RCTextInput
							inputRef={(e) => { this.topic = e; }}
							label={I18n.t('Topic')}
							value={topic}
							onChangeText={value => this.setState({ topic: value })}
							onSubmitEditing={() => { this.announcement.focus(); }}
							theme={theme}
							testID='room-info-edit-view-topic'
						/>
						<RCTextInput
							inputRef={(e) => { this.announcement = e; }}
							label={I18n.t('Announcement')}
							value={announcement}
							onChangeText={value => this.setState({ announcement: value })}
							onSubmitEditing={() => { this.joinCode.focus(); }}
							theme={theme}
							testID='room-info-edit-view-announcement'
						/>
						<RCTextInput
							inputRef={(e) => { this.joinCode = e; }}
							label={I18n.t('Password')}
							value={joinCode}
							onChangeText={value => this.setState({ joinCode: value })}
							onSubmitEditing={this.submit}
							secureTextEntry
							theme={theme}
							testID='room-info-edit-view-password'
						/>
						<SwitchContainer
							value={t}
							leftLabelPrimary={I18n.t('Public')}
							leftLabelSecondary={I18n.t('Everyone_can_access_this_channel')}
							rightLabelPrimary={I18n.t('Private')}
							rightLabelSecondary={I18n.t('Just_invited_people_can_access_this_channel')}
							onValueChange={this.toggleRoomType}
							theme={theme}
							testID='room-info-edit-view-t'
						/>
						<SwitchContainer
							value={ro}
							leftLabelPrimary={I18n.t('Collaborative')}
							leftLabelSecondary={I18n.t('All_users_in_the_channel_can_write_new_messages')}
							rightLabelPrimary={I18n.t('Read_Only')}
							rightLabelSecondary={I18n.t('Only_authorized_users_can_write_new_messages')}
							onValueChange={this.toggleReadOnly}
							disabled={!permissions[PERMISSION_SET_READONLY] || room.broadcast}
							theme={theme}
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
									onValueChange={this.toggleReactions}
									disabled={!permissions[PERMISSION_SET_REACT_WHEN_READONLY]}
									theme={theme}
									testID='room-info-edit-view-react-when-ro'
								/>
							)
							: null
						}
						{room.broadcast
							? [
								<Text style={styles.broadcast}>{I18n.t('Broadcast_Channel')}</Text>,
								<View style={[styles.divider, { borderColor: themes[theme].separatorColor }]} />
							]
							: null
						}
						{!compareServerVersion(serverVersion, '3.0.0', methods.lowerThan) ? (
							<SwitchContainer
								value={enableSysMes}
								leftLabelPrimary={I18n.t('Hide_System_Messages')}
								leftLabelSecondary={enableSysMes ? I18n.t('Overwrites_the_server_configuration_and_use_room_config') : I18n.t('Uses_server_configuration')}
								theme={theme}
								testID='room-info-edit-switch-system-messages'
								onValueChange={this.toggleHideSystemMessages}
								labelContainerStyle={styles.hideSystemMessages}
								leftLabelStyle={styles.systemMessagesLabel}
							>
								{this.renderSystemMessages()}
							</SwitchContainer>
						) : null}
						{encryptionEnabled ? (
							<SwitchContainer
								value={encrypted}
								disabled={!t}
								leftLabelPrimary={I18n.t('Encrypted')}
								leftLabelSecondary={I18n.t('End_to_end_encrypted_room')}
								theme={theme}
								testID='room-info-edit-switch-encrypted'
								onValueChange={this.toggleEncrypted}
								labelContainerStyle={styles.hideSystemMessages}
								leftLabelStyle={styles.systemMessagesLabel}
							/>
						) : null}
						<TouchableOpacity
							style={[
								styles.buttonContainer,
								{ backgroundColor: themes[theme].buttonBackground },
								!this.formIsChanged() && styles.buttonContainerDisabled
							]}
							onPress={this.submit}
							disabled={!this.formIsChanged()}
							testID='room-info-edit-view-submit'
						>
							<Text style={[styles.button, { color: themes[theme].buttonText }]} accessibilityTraits='button'>{I18n.t('SAVE')}</Text>
						</TouchableOpacity>
						<View style={{ flexDirection: 'row' }}>
							<TouchableOpacity
								style={[
									styles.buttonContainer_inverted,
									styles.buttonInverted,
									{ flex: 1, borderColor: themes[theme].auxiliaryText },
									!this.formIsChanged() && styles.buttonContainerDisabled
								]}
								onPress={this.reset}
								disabled={!this.formIsChanged()}
								testID='room-info-edit-view-reset'
							>
								<Text
									style={[
										styles.button,
										styles.button_inverted,
										{ color: themes[theme].bodyText }
									]}
									accessibilityTraits='button'
								>
									{I18n.t('RESET')}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[
									styles.buttonInverted,
									styles.buttonContainer_inverted,
									!this.hasArchivePermission() && sharedStyles.opacity5,
									{ flex: 1, marginLeft: 10, borderColor: dangerColor }
								]}
								onPress={this.toggleArchive}
								disabled={!this.hasArchivePermission()}
								testID={archived ? 'room-info-edit-view-unarchive' : 'room-info-edit-view-archive'}
							>
								<Text
									style={[
										styles.button,
										styles.button_inverted,
										{ color: dangerColor }
									]}
								>
									{ archived ? I18n.t('UNARCHIVE') : I18n.t('ARCHIVE') }
								</Text>
							</TouchableOpacity>
						</View>
						<View style={[styles.divider, { borderColor: themes[theme].separatorColor }]} />
						<TouchableOpacity
							style={[
								styles.buttonContainer_inverted,
								styles.buttonContainerLastChild,
								styles.buttonDanger,
								{ borderColor: dangerColor },
								!this.hasDeletePermission() && sharedStyles.opacity5
							]}
							onPress={this.delete}
							disabled={!this.hasDeletePermission()}
							testID='room-info-edit-view-delete'
						>
							<Text
								style={[
									styles.button,
									styles.button_inverted,
									{ color: dangerColor }
								]}
								accessibilityTraits='button'
							>
								{I18n.t('DELETE')}
							</Text>
						</TouchableOpacity>
						<Loading visible={saving} />
					</ScrollView>
				</SafeAreaView>
			</KeyboardView>
		);
	}
}

const mapStateToProps = state => ({
	serverVersion: state.server.version,
	encryptionEnabled: state.encryption.enabled,
	setReadOnlyPermission: state.permissions[PERMISSION_SET_READONLY],
	setReactWhenReadOnlyPermission: state.permissions[PERMISSION_SET_REACT_WHEN_READONLY],
	archiveRoomPermission: state.permissions[PERMISSION_ARCHIVE],
	unarchiveRoomPermission: state.permissions[PERMISSION_UNARCHIVE],
	deleteCPermission: state.permissions[PERMISSION_DELETE_C],
	deletePPermission: state.permissions[PERMISSION_DELETE_P]
});

const mapDispatchToProps = dispatch => ({
	deleteRoom: (rid, t) => dispatch(deleteRoomAction(rid, t))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(RoomInfoEditView));
