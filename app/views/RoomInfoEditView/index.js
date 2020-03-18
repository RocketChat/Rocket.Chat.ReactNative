import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, View, ScrollView, TouchableOpacity, Keyboard, Alert
} from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import equal from 'deep-equal';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';
import isEqual from 'lodash/isEqual';
import semver from 'semver';

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
import log from '../../utils/log';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import { themedHeader } from '../../utils/navigation';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { MultiSelect } from '../../containers/UIKit/MultiSelect';
import { MessageTypeValues } from '../../utils/messageTypes';

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

class RoomInfoEditView extends React.Component {
	static navigationOptions = ({ screenProps }) => ({
		title: I18n.t('Room_Info_Edit'),
		...themedHeader(screenProps.theme)
	})

	static propTypes = {
		navigation: PropTypes.object,
		deleteRoom: PropTypes.func,
		serverVersion: PropTypes.string,
		theme: PropTypes.string
	};

	constructor(props) {
		super(props);
		this.state = {
			room: {},
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
			enableSysMes: false
		};
		this.loadRoom();
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (!equal(nextState, this.state)) {
			return true;
		}
		if (!equal(nextProps, this.props)) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		if (this.querySubscription && this.querySubscription.unsubscribe) {
			this.querySubscription.unsubscribe();
		}
	}

	// eslint-disable-next-line react/sort-comp
	loadRoom = async() => {
		const { navigation } = this.props;
		const rid = navigation.getParam('rid', null);
		if (!rid) {
			return;
		}
		try {
			const db = database.active;
			const sub = await db.collections.get('subscriptions').find(rid);
			const observable = sub.observe();

			this.querySubscription = observable.subscribe((data) => {
				this.room = data;
				this.init(this.room);
			});

			const permissions = await RocketChat.hasPermission(PERMISSIONS_ARRAY, rid);
			this.setState({ permissions });
		} catch (e) {
			log(e);
		}
	}

	init = (room) => {
		const {
			name, description, topic, announcement, t, ro, reactWhenReadOnly, joinCodeRequired, sysMes
		} = room;
		// fake password just to user knows about it
		this.randomValue = random(15);
		this.setState({
			room,
			name,
			description,
			topic,
			announcement,
			t: t === 'p',
			ro,
			reactWhenReadOnly,
			joinCode: joinCodeRequired ? this.randomValue : '',
			archived: room.archived,
			systemMessages: sysMes,
			enableSysMes: sysMes && sysMes.length > 0
		});
	}

	clearErrors = () => {
		this.setState({
			nameError: {}
		});
	}

	reset = () => {
		this.clearErrors();
		this.init(this.room);
	}

	formIsChanged = () => {
		const {
			room, name, description, topic, announcement, t, ro, reactWhenReadOnly, joinCode, systemMessages, enableSysMes
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
			&& isEqual(room.sysMes, systemMessages)
			&& enableSysMes === (room.sysMes && room.sysMes.length > 0)
		);
	}

	submit = async() => {
		Keyboard.dismiss();
		const {
			room, name, description, topic, announcement, t, ro, reactWhenReadOnly, joinCode, systemMessages
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

		if (!isEqual(room.sysMes, systemMessages)) {
			params.systemMessages = systemMessages;
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
			log(e);
		}

		await this.setState({ saving: false });
		setTimeout(() => {
			if (error) {
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
							await RocketChat.toggleArchiveRoom(rid, t, !archived);
						} catch (e) {
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

	render() {
		const {
			name, nameError, description, topic, announcement, t, ro, reactWhenReadOnly, room, joinCode, saving, permissions, archived, enableSysMes
		} = this.state;
		const { serverVersion, theme } = this.props;
		const { dangerColor } = themes[theme];

		return (
			<KeyboardView
				style={{ backgroundColor: themes[theme].backgroundColor }}
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
			>
				<StatusBar theme={theme} />
				<ScrollView
					contentContainerStyle={sharedStyles.containerScrollView}
					testID='room-info-edit-view-list'
					{...scrollPersistTaps}
				>
					<SafeAreaView style={sharedStyles.container} testID='room-info-edit-view' forceInset={{ vertical: 'never' }}>
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
							onValueChange={value => this.setState({ t: value })}
							theme={theme}
							testID='room-info-edit-view-t'
						/>
						<SwitchContainer
							value={ro}
							leftLabelPrimary={I18n.t('Collaborative')}
							leftLabelSecondary={I18n.t('All_users_in_the_channel_can_write_new_messages')}
							rightLabelPrimary={I18n.t('Read_Only')}
							rightLabelSecondary={I18n.t('Only_authorized_users_can_write_new_messages')}
							onValueChange={value => this.setState({ ro: value })}
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
									onValueChange={value => this.setState({ reactWhenReadOnly: value })}
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
						{serverVersion && !semver.lt(serverVersion, '3.0.0') ? (
							<SwitchContainer
								value={enableSysMes}
								leftLabelPrimary={I18n.t('Hide_System_Messages')}
								leftLabelSecondary={enableSysMes ? I18n.t('Overwrites_the_server_configuration_and_use_room_config') : I18n.t('Uses_server_configuration')}
								theme={theme}
								testID='room-info-edit-switch-system-messages'
								onValueChange={value => this.setState(({ systemMessages }) => ({ enableSysMes: value, systemMessages: value ? systemMessages : [] }))}
								labelContainerStyle={styles.hideSystemMessages}
								leftLabelStyle={styles.systemMessagesLabel}
							>
								{this.renderSystemMessages()}
							</SwitchContainer>
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
					</SafeAreaView>
				</ScrollView>
			</KeyboardView>
		);
	}
}

const mapStateToProps = state => ({
	serverVersion: state.server.version
});

const mapDispatchToProps = dispatch => ({
	deleteRoom: (rid, t) => dispatch(deleteRoomAction(rid, t))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(RoomInfoEditView));
