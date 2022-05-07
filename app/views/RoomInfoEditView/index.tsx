import { Q } from '@nozbe/watermelondb';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';
import { dequal } from 'dequal';
import isEmpty from 'lodash/isEmpty';
import React from 'react';
import { Alert, Keyboard, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ImagePicker, { Image } from 'react-native-image-crop-picker';
import { connect } from 'react-redux';

import { deleteRoom } from '../../actions/room';
import { themes } from '../../lib/constants';
import Avatar from '../../containers/Avatar';
import Loading from '../../containers/Loading';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import RCTextInput from '../../containers/TextInput';
import { LISTENER } from '../../containers/Toast';
import { MultiSelect } from '../../containers/UIKit/MultiSelect';
import { IApplicationState, IBaseScreen, ISubscription, SubscriptionType, TSubscriptionModel, IAvatar } from '../../definitions';
import { ERoomType } from '../../definitions/ERoomType';
import I18n from '../../i18n';
import database from '../../lib/database';
import { CustomIcon } from '../../containers/CustomIcon';
import KeyboardView from '../../containers/KeyboardView';
import { TSupportedPermissions } from '../../reducers/permissions';
import { ModalStackParamList } from '../../stacks/MasterDetailStack/types';
import { ChatsStackParamList } from '../../stacks/types';
import { TSupportedThemes, withTheme } from '../../theme';
import EventEmitter from '../../utils/events';
import { showConfirmationAlert, showErrorAlert } from '../../utils/info';
import log, { events, logEvent } from '../../utils/log';
import { MessageTypeValues } from '../../utils/messageTypes';
import random from '../../utils/random';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import sharedStyles from '../Styles';
import styles from './styles';
import SwitchContainer from './SwitchContainer';
import { compareServerVersion } from '../../lib/methods/helpers/compareServerVersion';
import { getRoomTitle, hasPermission } from '../../lib/methods';
import { Services } from '../../lib/services';

interface IRoomInfoEditViewState {
	room: ISubscription;
	avatar: IAvatar;
	permissions: { [key in TSupportedPermissions]?: boolean };
	name: string;
	description?: string;
	topic?: string;
	announcement?: string;
	joinCode: string;
	nameError: any;
	saving: boolean;
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
	theme: TSupportedThemes;
	setReadOnlyPermission: string[];
	setReactWhenReadOnlyPermission: string[];
	archiveRoomPermission: string[];
	unarchiveRoomPermission: string[];
	deleteCPermission: string[];
	deletePPermission: string[];
	deleteTeamPermission: string[];
	isMasterDetail: boolean;
}

class RoomInfoEditView extends React.Component<IRoomInfoEditViewProps, IRoomInfoEditViewState> {
	randomValue = random(15);
	private querySubscription: any; // Observable dont have unsubscribe prop
	private room!: TSubscriptionModel;
	private name!: TextInput | null;
	private description!: TextInput | null;
	private topic!: TextInput | null;
	private announcement!: TextInput | null;
	private joinCode!: TextInput | null;

	static navigationOptions = () => ({
		title: I18n.t('Room_Info_Edit')
	});

	constructor(props: IRoomInfoEditViewProps) {
		super(props);
		this.state = {
			room: {} as ISubscription,
			avatar: {} as IAvatar,
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
			avatar: {} as IAvatar,
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
			encrypted,
			avatar
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
			room.encrypted === encrypted &&
			isEmpty(avatar)
		);
	};

	submit = async () => {
		logEvent(events.RI_EDIT_SAVE);
		Keyboard.dismiss();
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
			encrypted,
			avatar
		} = this.state;

		this.setState({ saving: true });
		let error = false;

		if (!this.formIsChanged()) {
			showErrorAlert(I18n.t('Nothing_to_save'));
			return;
		}

		// Clear error objects
		await this.clearErrors();

		const params = {} as any;

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
		if ((room.t === SubscriptionType.GROUP) !== t) {
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
			await Services.saveRoomSettings(room.rid, params);
		} catch (e: any) {
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
	};

	deleteTeam = async () => {
		const { room } = this.state;
		const { navigation, deleteCPermission, deletePPermission, dispatch } = this.props;

		try {
			const db = database.active;
			const subCollection = db.get('subscriptions');
			const teamChannels = await subCollection.query(
				Q.where('team_id', room.teamId as string),
				Q.where('team_main', Q.notEq(true))
			);

			const teamChannelOwner = [];
			// @ts-ignore - wm schema type error dont including array
			for (let i = 0; i < teamChannels.length; i += 1) {
				// @ts-ignore - wm schema type error dont including array
				const permissionType = teamChannels[i].t === 'c' ? deleteCPermission : deletePPermission;
				// @ts-ignore - wm schema type error dont including array
				// eslint-disable-next-line no-await-in-loop
				const permissions = await hasPermission([permissionType], teamChannels[i].rid);
				if (permissions[0]) {
					// @ts-ignore - wm schema type error dont including array
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

		return (
			<MultiSelect
				options={MessageTypeValues.map(m => ({
					value: m.value,
					text: { text: I18n.t('Hide_type_messages', { type: I18n.t(m.text) }) }
				}))}
				onChange={({ value }: { value: boolean }) => this.setState({ systemMessages: value })}
				placeholder={{ text: I18n.t('Hide_System_Messages') }}
				value={systemMessages as string[]}
				context={BLOCK_CONTEXT.FORM}
				multiselect
			/>
		);
	};

	changeAvatar = async () => {
		const options = {
			cropping: true,
			compressImageQuality: 0.8,
			cropperAvoidEmptySpaceAroundImage: false,
			cropperChooseText: I18n.t('Choose'),
			cropperCancelText: I18n.t('Cancel'),
			includeBase64: true
		};

		try {
			const response: Image = await ImagePicker.openPicker(options);
			this.setState({ avatar: { url: response.path, data: `data:image/jpeg;base64,${response.data}`, service: 'upload' } });
		} catch (e) {
			console.log(e);
		}
	};

	resetAvatar = () => {
		this.setState({ avatar: { data: null } });
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
			saving,
			permissions,
			archived,
			enableSysMes,
			encrypted,
			avatar
		} = this.state;
		const { serverVersion, encryptionEnabled, theme } = this.props;
		const { dangerColor } = themes[theme];

		return (
			<KeyboardView
				style={{ backgroundColor: themes[theme].backgroundColor }}
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}>
				<StatusBar />
				<SafeAreaView testID='room-info-edit-view' style={{ backgroundColor: themes[theme].backgroundColor }}>
					<ScrollView
						contentContainerStyle={sharedStyles.containerScrollView}
						testID='room-info-edit-view-list'
						{...scrollPersistTaps}>
						<TouchableOpacity
							style={styles.avatarContainer}
							onPress={this.changeAvatar}
							disabled={compareServerVersion(serverVersion || '', 'lowerThan', '3.6.0')}>
							<Avatar
								type={room.t}
								text={room.name}
								avatar={avatar?.url}
								isStatic={avatar?.url}
								rid={isEmpty(avatar) ? room.rid : undefined}
								size={100}>
								{serverVersion && compareServerVersion(serverVersion, 'lowerThan', '3.6.0') ? undefined : (
									<TouchableOpacity
										style={[styles.resetButton, { backgroundColor: themes[theme].dangerColor }]}
										onPress={this.resetAvatar}>
										<CustomIcon name='delete' color={themes[theme].backgroundColor} size={24} />
									</TouchableOpacity>
								)}
							</Avatar>
						</TouchableOpacity>
						<RCTextInput
							inputRef={e => {
								this.name = e;
							}}
							label={I18n.t('Name')}
							value={name}
							onChangeText={value => this.setState({ name: value })}
							onSubmitEditing={() => {
								this.description?.focus();
							}}
							error={nameError}
							theme={theme}
							testID='room-info-edit-view-name'
						/>
						<RCTextInput
							inputRef={e => {
								this.description = e;
							}}
							label={I18n.t('Description')}
							value={description}
							onChangeText={value => this.setState({ description: value })}
							onSubmitEditing={() => {
								this.topic?.focus();
							}}
							theme={theme}
							testID='room-info-edit-view-description'
						/>
						<RCTextInput
							inputRef={e => {
								this.topic = e;
							}}
							label={I18n.t('Topic')}
							value={topic}
							onChangeText={value => this.setState({ topic: value })}
							onSubmitEditing={() => {
								this.announcement?.focus();
							}}
							theme={theme}
							testID='room-info-edit-view-topic'
						/>
						<RCTextInput
							inputRef={e => {
								this.announcement = e;
							}}
							label={I18n.t('Announcement')}
							value={announcement}
							onChangeText={value => this.setState({ announcement: value })}
							onSubmitEditing={() => {
								this.joinCode?.focus();
							}}
							theme={theme}
							testID='room-info-edit-view-announcement'
						/>
						<RCTextInput
							inputRef={e => {
								this.joinCode = e;
							}}
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
							leftLabelSecondary={
								room.teamMain ? I18n.t('Everyone_can_access_this_team') : I18n.t('Everyone_can_access_this_channel')
							}
							rightLabelPrimary={I18n.t('Private')}
							rightLabelSecondary={
								room.teamMain
									? I18n.t('Just_invited_people_can_access_this_team')
									: I18n.t('Just_invited_people_can_access_this_channel')
							}
							onValueChange={this.toggleRoomType}
							theme={theme}
							testID='room-info-edit-view-t'
						/>
						<SwitchContainer
							value={ro}
							leftLabelPrimary={I18n.t('Collaborative')}
							leftLabelSecondary={
								room.teamMain
									? I18n.t('All_users_in_the_team_can_write_new_messages')
									: I18n.t('All_users_in_the_channel_can_write_new_messages')
							}
							rightLabelPrimary={I18n.t('Read_Only')}
							rightLabelSecondary={I18n.t('Only_authorized_users_can_write_new_messages')}
							onValueChange={this.toggleReadOnly}
							disabled={!permissions['set-readonly'] || room.broadcast}
							theme={theme}
							testID='room-info-edit-view-ro'
						/>
						{ro && !room.broadcast ? (
							<SwitchContainer
								value={reactWhenReadOnly as boolean}
								leftLabelPrimary={I18n.t('No_Reactions')}
								leftLabelSecondary={I18n.t('Reactions_are_disabled')}
								rightLabelPrimary={I18n.t('Allow_Reactions')}
								rightLabelSecondary={I18n.t('Reactions_are_enabled')}
								onValueChange={this.toggleReactions}
								disabled={!permissions['set-react-when-readonly']}
								theme={theme}
								testID='room-info-edit-view-react-when-ro'
							/>
						) : null}
						{room.broadcast
							? [
									<Text style={styles.broadcast}>{I18n.t('Broadcast_Channel')}</Text>,
									<View style={[styles.divider, { borderColor: themes[theme].separatorColor }]} />
							  ]
							: null}
						{serverVersion && !compareServerVersion(serverVersion, 'lowerThan', '3.0.0') ? (
							<SwitchContainer
								value={enableSysMes as boolean}
								leftLabelPrimary={I18n.t('Hide_System_Messages')}
								leftLabelSecondary={
									enableSysMes
										? I18n.t('Overwrites_the_server_configuration_and_use_room_config')
										: I18n.t('Uses_server_configuration')
								}
								theme={theme}
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
							testID='room-info-edit-view-submit'>
							<Text style={[styles.button, { color: themes[theme].buttonText }]} accessibilityRole='button'>
								{I18n.t('SAVE')}
							</Text>
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
								testID='room-info-edit-view-reset'>
								<Text
									style={[styles.button, styles.button_inverted, { color: themes[theme].bodyText }]}
									accessibilityRole='button'>
									{I18n.t('RESET')}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[
									styles.buttonInverted,
									styles.buttonContainer_inverted,
									archived
										? !permissions['unarchive-room'] && sharedStyles.opacity5
										: !permissions['archive-room'] && sharedStyles.opacity5,
									{ flex: 1, marginLeft: 10, borderColor: dangerColor }
								]}
								onPress={this.toggleArchive}
								disabled={archived ? !permissions['unarchive-room'] : !permissions['archive-room']}
								testID={archived ? 'room-info-edit-view-unarchive' : 'room-info-edit-view-archive'}>
								<Text style={[styles.button, styles.button_inverted, { color: dangerColor }]}>
									{archived ? I18n.t('UNARCHIVE') : I18n.t('ARCHIVE')}
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
							onPress={room.teamMain ? this.deleteTeam : this.delete}
							disabled={!this.hasDeletePermission()}
							testID='room-info-edit-view-delete'>
							<Text style={[styles.button, styles.button_inverted, { color: dangerColor }]} accessibilityRole='button'>
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
