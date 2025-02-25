import React from 'react';
import { Q } from '@nozbe/watermelondb';
import { BlockContext } from '@rocket.chat/ui-kit';
import { dequal } from 'dequal';
import { Alert, Keyboard, ScrollView, Text, TextInput, View } from 'react-native';
import { connect } from 'react-redux';
import { Subscription } from 'rxjs';

import { deleteRoom } from '../../actions/room';
import { themes } from '../../lib/constants';
import { AvatarWithEdit } from '../../containers/Avatar';
import { sendLoadingEvent } from '../../containers/Loading';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import { FormTextInput } from '../../containers/TextInput';
import { LISTENER } from '../../containers/Toast';
import { MultiSelect } from '../../containers/UIKit/MultiSelect';
import {
	IApplicationState,
	IBaseScreen,
	IRoomSettings,
	ISubscription,
	SubscriptionType,
	TSubscriptionModel
} from '../../definitions';
import { ERoomType } from '../../definitions/ERoomType';
import I18n from '../../i18n';
import database from '../../lib/database';
import KeyboardView from '../../containers/KeyboardView';
import { TSupportedPermissions } from '../../reducers/permissions';
import { ModalStackParamList } from '../../stacks/MasterDetailStack/types';
import { ChatsStackParamList } from '../../stacks/types';
import { withTheme } from '../../theme';
import EventEmitter from '../../lib/methods/helpers/events';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { MessageTypeValues } from './messageTypes';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import sharedStyles from '../Styles';
import styles from './styles';
import SwitchContainer from './SwitchContainer';
import {
	getRoomTitle,
	hasPermission,
	compareServerVersion,
	showConfirmationAlert,
	showErrorAlert,
	random
} from '../../lib/methods/helpers';
import { Services } from '../../lib/services';
import Button from '../../containers/Button';

interface IRoomInfoEditViewState {
	room: ISubscription;
	permissions: { [key in TSupportedPermissions]?: boolean };
	name: string;
	description?: string;
	topic?: string;
	announcement?: string;
	joinCode: string;
	nameError: any;
	t: boolean;
	ro: boolean;
	reactWhenReadOnly?: boolean;
	archived: boolean;
	systemMessages?: boolean | string[];
	enableSysMes?: boolean | string[];
	encrypted?: boolean;
}

interface IRoomInfoEditViewProps extends IBaseScreen<ChatsStackParamList | ModalStackParamList, 'RoomInfoEditView'> {
	serverVersion?: string;
	encryptionEnabled: boolean;
	setReadOnlyPermission: string[];
	setReactWhenReadOnlyPermission: string[];
	archiveRoomPermission: string[];
	unarchiveRoomPermission: string[];
	deleteCPermission: string[];
	deletePPermission: string[];
	deleteTeamPermission: string[];
}

const MESSAGE_TYPE_VALUES = MessageTypeValues.map(m => ({
	value: m.value,
	text: { text: I18n.t('Hide_type_messages', { type: I18n.t(m.text) }) }
}));

class RoomInfoEditView extends React.Component<IRoomInfoEditViewProps, IRoomInfoEditViewState> {
	randomValue = random(15);
	private querySubscription: Subscription | undefined;
	private room: TSubscriptionModel;
	private name: TextInput | null | undefined;
	private description: TextInput | null | undefined;
	private topic: TextInput | null | undefined;
	private announcement: TextInput | null | undefined;
	private joinCode: TextInput | null | undefined;

	static navigationOptions = () => ({
		title: I18n.t('Room_Info_Edit')
	});

	constructor(props: IRoomInfoEditViewProps) {
		super(props);
		this.room = {} as TSubscriptionModel;
		this.state = {
			room: {} as ISubscription,
			permissions: {},
			name: '',
			description: '',
			topic: '',
			announcement: '',
			joinCode: '',
			nameError: {},
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

	loadRoom = async () => {
		const {
			route,
			setReadOnlyPermission,
			setReactWhenReadOnlyPermission,
			archiveRoomPermission,
			unarchiveRoomPermission,
			deleteCPermission,
			deletePPermission,
			deleteTeamPermission
		} = this.props;
		const rid = route.params?.rid;
		if (!rid) {
			return;
		}
		try {
			const db = database.active;
			const sub = await db.get('subscriptions').find(rid);
			const observable = sub.observe();

			this.querySubscription = observable.subscribe(data => {
				this.room = data;
				this.init(this.room);
			});

			const result = await hasPermission(
				[
					setReadOnlyPermission,
					setReactWhenReadOnlyPermission,
					archiveRoomPermission,
					unarchiveRoomPermission,
					deleteCPermission,
					deletePPermission,
					...(this.room.teamMain ? [deleteTeamPermission] : [])
				],
				rid
			);

			this.setState({
				permissions: {
					'set-readonly': result[0],
					'set-react-when-readonly': result[1],
					'archive-room': result[2],
					'unarchive-room': result[3],
					'delete-c': result[4],
					'delete-p': result[5],
					...(this.room.teamMain && { 'delete-team': result[6] })
				}
			});
		} catch (e) {
			log(e);
		}
	};

	init = (room: ISubscription) => {
		const { description, topic, announcement, t, ro, reactWhenReadOnly, joinCodeRequired, encrypted } = room;
		const sysMes = room.sysMes as string[];
		// fake password just to user knows about it
		this.setState({
			room,
			name: getRoomTitle(room),
			description,
			topic,
			announcement,
			t: t === 'p',
			ro,
			reactWhenReadOnly,
			joinCode: joinCodeRequired ? this.randomValue : '',
			archived: room.archived,
			systemMessages: sysMes,
			enableSysMes: sysMes && sysMes.length > 0,
			encrypted
		});
	};

	clearErrors = () => {
		this.setState({
			nameError: {}
		});
	};

	reset = () => {
		logEvent(events.RI_EDIT_RESET);
		this.clearErrors();
		this.init(this.room);
	};

	formIsChanged = () => {
		const {
			room,
			name,
			description,
			topic,
			announcement,
			t,
			ro,
			reactWhenReadOnly,
			joinCode,
			systemMessages,
			enableSysMes,
			encrypted
		} = this.state;
		const { joinCodeRequired } = room;
		const sysMes = room.sysMes as string[];
		return !(
			room.name === name &&
			room.description === description &&
			room.topic === topic &&
			room.announcement === announcement &&
			(joinCodeRequired ? this.randomValue : '') === joinCode &&
			(room.t === 'p') === t &&
			room.ro === ro &&
			room.reactWhenReadOnly === reactWhenReadOnly &&
			dequal(sysMes, systemMessages) &&
			enableSysMes === (sysMes && sysMes.length > 0) &&
			room.encrypted === encrypted
		);
	};

	submit = async () => {
		logEvent(events.RI_EDIT_SAVE);
		Keyboard.dismiss();
		const { room, name, description, topic, announcement, t, ro, reactWhenReadOnly, joinCode, systemMessages, encrypted } =
			this.state;

		sendLoadingEvent({ visible: true });
		let error = false;

		if (!this.formIsChanged()) {
			showErrorAlert(I18n.t('Nothing_to_save'));
			return;
		}

		// Clear error objects
		await this.clearErrors();

		const params = {} as IRoomSettings;

		// Name
		if (getRoomTitle(room) !== name) {
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
		if ((room.t === SubscriptionType.GROUP) !== t) {
			params.roomType = t ? ('p' as SubscriptionType) : ('c' as SubscriptionType);
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
			params.systemMessages = systemMessages as string[];
		}

		// Join Code
		if (room.joinCodeRequired && this.randomValue !== joinCode) {
			params.joinCode = joinCode;
		}

		// Encrypted
		if (room.encrypted !== encrypted) {
			params.encrypted = encrypted;
		}

		try {
			await Services.saveRoomSettings(room.rid, params);
		} catch (e: any) {
			if (e.error === 'error-invalid-room-name') {
				this.setState({ nameError: e });
			}
			error = true;
			log(e);
		}

		sendLoadingEvent({ visible: false });
		setTimeout(() => {
			if (error) {
				logEvent(events.RI_EDIT_SAVE_F);
				showErrorAlert(I18n.t('There_was_an_error_while_action', { action: I18n.t('saving_settings') }));
			} else {
				EventEmitter.emit(LISTENER, { message: I18n.t('Settings_succesfully_changed') });
			}
		}, 100);
	};

	deleteTeam = async () => {
		const { room } = this.state;
		const { navigation, deleteCPermission, deletePPermission, dispatch } = this.props;

		try {
			const db = database.active;
			const subCollection = db.get('subscriptions');
			const teamChannels = await subCollection
				.query(Q.where('team_id', room.teamId as string), Q.where('team_main', Q.notEq(true)))
				.fetch();

			const teamChannelOwner = [];
			for (let i = 0; i < teamChannels.length; i += 1) {
				const permissionType = teamChannels[i].t === 'c' ? deleteCPermission : deletePPermission;
				// eslint-disable-next-line no-await-in-loop
				const permissions = await hasPermission([permissionType], teamChannels[i].rid);
				if (permissions[0]) {
					teamChannelOwner.push(teamChannels[i]);
				}
			}

			if (teamChannelOwner.length) {
				navigation.navigate('SelectListView', {
					title: 'Delete_Team',
					data: teamChannelOwner,
					infoText: 'Select_channels_to_delete',
					nextAction: (selected: string[]) => {
						showConfirmationAlert({
							message: I18n.t('You_are_deleting_the_team', { team: getRoomTitle(room) }),
							confirmationText: I18n.t('Yes_action_it', { action: I18n.t('delete') }),
							onPress: () => deleteRoom(ERoomType.t, room, selected)
						});
					}
				});
			} else {
				showConfirmationAlert({
					message: I18n.t('You_are_deleting_the_team', { team: getRoomTitle(room) }),
					confirmationText: I18n.t('Yes_action_it', { action: I18n.t('delete') }),
					onPress: () => dispatch(deleteRoom(ERoomType.t, room))
				});
			}
		} catch (e: any) {
			log(e);
			showErrorAlert(
				e.data.error ? I18n.t(e.data.error) : I18n.t('There_was_an_error_while_action', { action: I18n.t('deleting_team') }),
				I18n.t('Cannot_delete')
			);
		}
	};

	delete = () => {
		const { room } = this.state;
		const { dispatch } = this.props;

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
					onPress: () => dispatch(deleteRoom(ERoomType.c, room))
				}
			],
			{ cancelable: false }
		);
	};

	toggleArchive = () => {
		const { room } = this.state;
		const { rid, archived, t } = room;

		const action = I18n.t(`${archived ? 'un' : ''}archive`);
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
					onPress: async () => {
						try {
							logEvent(events.RI_EDIT_TOGGLE_ARCHIVE);
							await Services.toggleArchiveRoom(rid, t as SubscriptionType, !archived);
						} catch (e) {
							logEvent(events.RI_EDIT_TOGGLE_ARCHIVE_F);
							log(e);
						}
					}
				}
			],
			{ cancelable: false }
		);
	};

	hasDeletePermission = () => {
		const { room, permissions } = this.state;

		if (room.teamMain) {
			return permissions['delete-team'];
		}

		if (room.t === 'p') {
			return permissions['delete-p'];
		}

		return permissions['delete-c'];
	};

	renderSystemMessages = () => {
		const { systemMessages, enableSysMes } = this.state;

		if (!enableSysMes) {
			return null;
		}

		const values = Array.isArray(systemMessages)
			? MESSAGE_TYPE_VALUES.filter((option: any) => systemMessages.includes(option.value))
			: [];

		return (
			<MultiSelect
				options={MESSAGE_TYPE_VALUES}
				onChange={({ value }) => this.setState({ systemMessages: value })}
				placeholder={{ text: I18n.t('Hide_System_Messages') }}
				value={values}
				context={BlockContext.FORM}
				multiselect
			/>
		);
	};

	handleEditAvatar = () => {
		const { navigation } = this.props;
		const { room } = this.state;
		navigation.navigate('ChangeAvatarView', { titleHeader: I18n.t('Room_Info'), room, t: room.t, context: 'room' });
	};

	toggleRoomType = (value: boolean) => {
		logEvent(events.RI_EDIT_TOGGLE_ROOM_TYPE);
		this.setState(({ encrypted }) => ({ t: value, encrypted: value && encrypted }));
	};

	toggleReadOnly = (value: boolean) => {
		logEvent(events.RI_EDIT_TOGGLE_READ_ONLY);
		this.setState({ ro: value });
	};

	toggleReactions = (value: boolean) => {
		logEvent(events.RI_EDIT_TOGGLE_REACTIONS);
		this.setState({ reactWhenReadOnly: value });
	};

	toggleHideSystemMessages = (value: boolean) => {
		logEvent(events.RI_EDIT_TOGGLE_SYSTEM_MSG);
		this.setState(({ systemMessages }) => ({ enableSysMes: value, systemMessages: value ? systemMessages : [] }));
	};

	toggleEncrypted = (value: boolean) => {
		logEvent(events.RI_EDIT_TOGGLE_ENCRYPTED);
		this.setState({ encrypted: value });
	};

	render() {
		const {
			name,
			nameError,
			description,
			topic,
			announcement,
			t,
			ro,
			reactWhenReadOnly,
			room,
			joinCode,
			permissions,
			archived,
			enableSysMes,
			encrypted
		} = this.state;
		const { serverVersion, encryptionEnabled, theme } = this.props;

		return (
			<KeyboardView
				style={{ backgroundColor: themes[theme].surfaceRoom }}
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}>
				<StatusBar />
				<SafeAreaView testID='room-info-edit-view' style={{ backgroundColor: themes[theme].surfaceRoom }}>
					<ScrollView
						contentContainerStyle={sharedStyles.containerScrollView}
						testID='room-info-edit-view-list'
						{...scrollPersistTaps}>
						<View style={styles.avatarContainer}>
							<AvatarWithEdit type={room.t} text={room.name} rid={room.rid} handleEdit={this.handleEditAvatar} />
						</View>
						<View style={styles.inputs}>
							<FormTextInput
								inputRef={e => {
									this.name = e;
								}}
								label={I18n.t('Name')}
								value={name}
								onChangeText={value => this.setState({ name: value })}
								onSubmitEditing={() => {
									this.topic?.focus();
								}}
								error={nameError}
								testID='room-info-edit-view-name'
								required
							/>
							<FormTextInput
								inputRef={e => {
									this.topic = e;
								}}
								label={I18n.t('Topic')}
								value={topic}
								onChangeText={value => this.setState({ topic: value })}
								onSubmitEditing={() => {
									this.announcement?.focus();
								}}
								testID='room-info-edit-view-topic'
							/>
							<FormTextInput
								inputRef={e => {
									this.announcement = e;
								}}
								label={I18n.t('Announcement')}
								value={announcement}
								onChangeText={value => this.setState({ announcement: value })}
								onSubmitEditing={() => {
									this.description?.focus();
								}}
								testID='room-info-edit-view-announcement'
							/>
							<FormTextInput
								inputRef={e => {
									this.description = e;
								}}
								label={I18n.t('Description')}
								value={description}
								onChangeText={value => this.setState({ description: value })}
								onSubmitEditing={() => {
									this.joinCode?.focus();
								}}
								testID='room-info-edit-view-description'
							/>
						</View>

						<FormTextInput
							inputRef={e => {
								this.joinCode = e;
							}}
							label={I18n.t('Room_Password')}
							value={joinCode}
							onChangeText={value => this.setState({ joinCode: value })}
							secureTextEntry
							testID='room-info-edit-view-password'
						/>
						<View style={styles.switches}>
							<SwitchContainer
								value={t}
								leftLabelPrimary={I18n.t('Public')}
								leftLabelSecondary={
									room.teamMain ? I18n.t('Everyone_can_access_this_team') : I18n.t('Everyone_can_access_this_channel')
								}
								onValueChange={this.toggleRoomType}
								testID='room-info-edit-view-t'
							/>

							<SwitchContainer
								value={ro}
								leftLabelPrimary={I18n.t('Read_Only')}
								leftLabelSecondary={
									room.teamMain
										? I18n.t('All_users_in_the_team_can_write_new_messages')
										: I18n.t('All_users_in_the_channel_can_write_new_messages')
								}
								onValueChange={this.toggleReadOnly}
								disabled={!permissions['set-readonly'] || room.broadcast}
								testID='room-info-edit-view-ro'
							/>
							{ro && !room.broadcast ? (
								<SwitchContainer
									value={reactWhenReadOnly as boolean}
									leftLabelPrimary={I18n.t('No_Reactions')}
									leftLabelSecondary={I18n.t('Reactions_are_disabled')}
									onValueChange={this.toggleReactions}
									disabled={!permissions['set-react-when-readonly']}
									testID='room-info-edit-view-react-when-ro'
								/>
							) : null}
							{room.broadcast
								? [
										<Text style={styles.broadcast}>{I18n.t('Broadcast')}</Text>,
										<View style={[styles.divider, { borderColor: themes[theme].strokeLight }]} />
								  ]
								: null}
							{serverVersion && !compareServerVersion(serverVersion, 'lowerThan', '3.0.0') ? (
								<SwitchContainer
									value={enableSysMes as boolean}
									leftLabelPrimary={I18n.t('Hide_System_Messages')}
									testID='room-info-edit-switch-system-messages'
									onValueChange={this.toggleHideSystemMessages}
									labelContainerStyle={styles.hideSystemMessages}
									leftLabelStyle={styles.systemMessagesLabel}>
									{this.renderSystemMessages()}
								</SwitchContainer>
							) : null}
							{encryptionEnabled ? (
								<SwitchContainer
									value={encrypted as boolean}
									disabled={!t}
									leftLabelPrimary={I18n.t('Encrypted')}
									leftLabelSecondary={I18n.t('End_to_end_encrypted_room')}
									testID='room-info-edit-switch-encrypted'
									onValueChange={this.toggleEncrypted}
									labelContainerStyle={styles.hideSystemMessages}
									leftLabelStyle={styles.systemMessagesLabel}
								/>
							) : null}
						</View>
						<Button
							title={I18n.t('Save_Changes')}
							onPress={this.submit}
							disabled={!this.formIsChanged()}
							testID='room-info-edit-view-submit'
							style={{ marginBottom: 0 }}
						/>
						<View style={[styles.divider, { borderColor: themes[theme].strokeLight }]} />

						<Button
							backgroundColor={themes[theme].buttonBackgroundSecondaryDefault}
							title={I18n.t('RESET')}
							onPress={this.reset}
							disabled={!this.formIsChanged()}
							testID='room-info-edit-view-reset'
						/>
						<Button
							backgroundColor={themes[theme].buttonBackgroundSecondaryDefault}
							color={themes[theme].fontTitlesLabels}
							title={archived ? I18n.t('UNARCHIVE') : I18n.t('ARCHIVE')}
							onPress={this.toggleArchive}
							disabled={archived ? !permissions['unarchive-room'] : !permissions['archive-room']}
							testID={archived ? 'room-info-edit-view-unarchive' : 'room-info-edit-view-archive'}
							style={{ marginBottom: 0 }}
						/>

						<View style={[styles.divider, { borderColor: themes[theme].strokeLight }]} />
						<Button
							color={themes[theme].buttonFontSecondaryDanger}
							backgroundColor={themes[theme].buttonBackgroundSecondaryDefault}
							title={I18n.t('Delete')}
							onPress={room.teamMain ? this.deleteTeam : this.delete}
							disabled={!this.hasDeletePermission()}
							testID='room-info-edit-view-delete'
						/>
					</ScrollView>
				</SafeAreaView>
			</KeyboardView>
		);
	}
}

const mapStateToProps = (state: IApplicationState) => ({
	serverVersion: state.server.version as string,
	encryptionEnabled: state.encryption.enabled,
	setReadOnlyPermission: state.permissions['set-readonly'] as string[],
	setReactWhenReadOnlyPermission: state.permissions['set-react-when-readonly'] as string[],
	archiveRoomPermission: state.permissions['archive-room'] as string[],
	unarchiveRoomPermission: state.permissions['unarchive-room'] as string[],
	deleteCPermission: state.permissions['delete-c'] as string[],
	deletePPermission: state.permissions['delete-p'] as string[],
	deleteTeamPermission: state.permissions['delete-team'] as string[],
	isMasterDetail: state.app.isMasterDetail
});

export default connect(mapStateToProps)(withTheme(RoomInfoEditView));
