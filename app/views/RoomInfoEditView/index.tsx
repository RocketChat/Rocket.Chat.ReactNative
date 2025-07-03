import React, { useLayoutEffect, useState } from 'react';
import { BlockContext } from '@rocket.chat/ui-kit';
import { dequal } from 'dequal';
import { Alert, Keyboard, ScrollView, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';

import { useAppSelector } from '../../lib/hooks';
import { AvatarWithEdit } from '../../containers/Avatar';
import { sendLoadingEvent } from '../../containers/Loading';
import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import { ControlledFormTextInput } from '../../containers/TextInput';
import { LISTENER } from '../../containers/Toast';
import { MultiSelect } from '../../containers/UIKit/MultiSelect';
import { IBaseScreen, IRoomSettings, ISubscription, SubscriptionType } from '../../definitions';
import I18n from '../../i18n';
import KeyboardView from '../../containers/KeyboardView';
import { TSupportedPermissions } from '../../reducers/permissions';
import { ModalStackParamList } from '../../stacks/MasterDetailStack/types';
import { ChatsStackParamList } from '../../stacks/types';
import { useTheme } from '../../theme';
import EventEmitter from '../../lib/methods/helpers/events';
import log, { events, logEvent } from '../../lib/methods/helpers/log';
import { MessageTypeValues } from './messageTypes';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import sharedStyles from '../Styles';
import styles from './styles';
import SwitchContainer from './SwitchContainer';
import { getRoomTitle, compareServerVersion, showErrorAlert, isAndroid, random } from '../../lib/methods/helpers';
import { Services } from '../../lib/services';
import Button from '../../containers/Button';
import useRoomSubscription from './hooks/useRoomSubscription';
import useDeleteTeamOrRoom from './hooks/useDeleteTeamOrRoom';

interface IRoomInfoEditViewProps extends IBaseScreen<ChatsStackParamList | ModalStackParamList, 'RoomInfoEditView'> {}

const MESSAGE_TYPE_VALUES = MessageTypeValues.map(m => ({
	value: m.value,
	text: { text: I18n.t('Hide_type_messages', { type: I18n.t(m.text) }) }
}));

const RoomInfoEditView = ({ navigation, route }: IRoomInfoEditViewProps) => {
	const { colors } = useTheme();
	const {
		archiveRoomPermission,
		deleteCPermission,
		deletePPermission,
		deleteTeamPermission,
		encryptionEnabled,
		serverVersion,
		setReactWhenReadOnlyPermission,
		setReadOnlyPermission,
		unarchiveRoomPermission
	} = useAppSelector(state => ({
		serverVersion: state.server.version as string,
		encryptionEnabled: state.encryption.enabled,
		setReadOnlyPermission: state.permissions['set-readonly'] as string[],
		setReactWhenReadOnlyPermission: state.permissions['set-react-when-readonly'] as string[],
		archiveRoomPermission: state.permissions['archive-room'] as string[],
		unarchiveRoomPermission: state.permissions['unarchive-room'] as string[],
		deleteCPermission: state.permissions['delete-c'] as string[],
		deletePPermission: state.permissions['delete-p'] as string[],
		deleteTeamPermission: state.permissions['delete-team'] as string[]
	}));
	const randomValue = random(15);
	const [t, setT] = useState(false);
	const [readOnly, setReadOnly] = useState(false);
	const [reactWhenReadOnly, setReactWhenReadOnly] = useState<boolean | undefined>(false);
	const [archived, setArchived] = useState<boolean | undefined>(false);
	const [systemMessages, setSystemMessages] = useState<string[]>([]);
	const [enableSysMes, setEnableSysMes] = useState(false);
	const [encrypted, setEncrypted] = useState<boolean | undefined>(false);
	const [permissions, setPermissions] = useState<{ [key in TSupportedPermissions]?: boolean }>({});
	const {
		control,
		clearErrors,
		setFocus,
		setError,
		setValue,
		getValues,
		formState: { errors, isDirty }
	} = useForm({
		defaultValues: {
			name: '',
			topic: '',
			announcement: '',
			description: '',
			joinCode: ''
		}
	});

	const initializeRoomState = (room: ISubscription) => {
		const { description, topic, announcement, t, ro, reactWhenReadOnly, joinCodeRequired, encrypted } = room;
		const sysMes = room.sysMes as string[];
		// fake password just to user knows about it
		setValue('name', getRoomTitle(room));
		setValue('description', description || '');
		setValue('topic', topic || '');
		setValue('announcement', announcement || '');
		setValue('joinCode', joinCodeRequired ? randomValue : '');
		setT(t !== 'p');
		setReadOnly(ro);
		setReactWhenReadOnly(reactWhenReadOnly);
		setArchived(room.archived);
		setSystemMessages(sysMes);
		setEnableSysMes(sysMes && sysMes.length > 0);
		setEncrypted(encrypted);
	};

	const { room } = useRoomSubscription({
		archiveRoomPermission,
		deleteCPermission,
		deletePPermission,
		deleteTeamPermission,
		rid: route.params?.rid,
		setReactWhenReadOnlyPermission,
		setReadOnlyPermission,
		unarchiveRoomPermission,
		setPermissions,
		initializeRoomState
	});
	const { handleDeleteTeam, handleDeleteRoom } = useDeleteTeamOrRoom({ navigation, room, deleteCPermission, deletePPermission });

	const submit = async () => {
		const { name, description, topic, announcement, joinCode } = getValues();
		logEvent(events.RI_EDIT_SAVE);
		Keyboard.dismiss();

		sendLoadingEvent({ visible: true });
		let error = false;

		if (!isDirty) {
			showErrorAlert(I18n.t('Nothing_to_save'));
			return;
		}

		clearErrors();

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
		if ((room.t === SubscriptionType.CHANNEL) !== t) {
			params.roomType = t ? ('c' as SubscriptionType) : ('p' as SubscriptionType);
		}
		// Read Only
		if (room.ro !== readOnly) {
			params.readOnly = readOnly;
		}
		// React When Read Only
		if (room.reactWhenReadOnly !== reactWhenReadOnly) {
			params.reactWhenReadOnly = reactWhenReadOnly;
		}

		if (!dequal(room.sysMes, systemMessages)) {
			params.systemMessages = systemMessages as string[];
		}

		// Join Code
		if (room.joinCodeRequired && randomValue !== joinCode) {
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
				setError('name', { message: e, type: 'validate' });
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

	const toggleArchive = () => {
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

	const hasDeletePermission = () => {
		if (room.teamMain) {
			return permissions['delete-team'];
		}

		if (room.t === 'p') {
			return permissions['delete-p'];
		}

		return permissions['delete-c'];
	};

	const renderSystemMessages = () => {
		if (!enableSysMes) {
			return null;
		}

		const values = Array.isArray(systemMessages)
			? MESSAGE_TYPE_VALUES.filter((option: any) => systemMessages.includes(option.value))
			: [];

		return (
			<MultiSelect
				options={MESSAGE_TYPE_VALUES}
				onChange={({ value }) => setSystemMessages(value)}
				placeholder={{ text: I18n.t('Hide_System_Messages') }}
				value={values}
				context={BlockContext.FORM}
				multiselect
			/>
		);
	};

	const handleEditAvatar = () => {
		navigation.navigate('ChangeAvatarView', { titleHeader: I18n.t('Room_Info'), room, t: room.t, context: 'room' });
	};

	const toggleRoomType = (value: boolean) => {
		logEvent(events.RI_EDIT_TOGGLE_ROOM_TYPE);
		setT(value);
		setEncrypted(value && encrypted);
	};

	const toggleReadOnly = (value: boolean) => {
		logEvent(events.RI_EDIT_TOGGLE_READ_ONLY);
		setReadOnly(value);
	};

	const toggleReactions = (value: boolean) => {
		logEvent(events.RI_EDIT_TOGGLE_REACTIONS);
		setReactWhenReadOnly(value);
	};

	const toggleHideSystemMessages = (value: boolean) => {
		logEvent(events.RI_EDIT_TOGGLE_SYSTEM_MSG);
		setEnableSysMes(value);
		setSystemMessages(value ? systemMessages : []);
	};

	const toggleEncrypted = (value: boolean) => {
		logEvent(events.RI_EDIT_TOGGLE_ENCRYPTED);
		setEncrypted(value);
	};

	const onResetPress = () => {
		logEvent(events.RI_EDIT_RESET);
		initializeRoomState(room);
		clearErrors();
	};

	const onDeletePress = () => {
		if (room.teamMain) {
			handleDeleteTeam();
		} else {
			handleDeleteRoom();
		}
	};

	useLayoutEffect(() => {
		navigation.setOptions({ title: I18n.t('Room_Info_Edit') });
	}, [navigation, route]);

	return (
		<KeyboardView>
			<StatusBar />
			<SafeAreaView testID='room-info-edit-view' style={{ backgroundColor: colors.surfaceRoom }}>
				<ScrollView
					contentContainerStyle={sharedStyles.containerScrollView}
					testID='room-info-edit-view-list'
					{...scrollPersistTaps}>
					<View style={styles.avatarContainer}>
						<AvatarWithEdit
							editAccessibilityLabel={I18n.t('Edit_Room_Photo')}
							type={room.t}
							text={room.name}
							rid={room.rid}
							handleEdit={handleEditAvatar}
						/>
					</View>
					<View style={styles.inputs}>
						<ControlledFormTextInput
							control={control}
							name='name'
							label={I18n.t('Name')}
							error={errors.name?.message}
							onSubmitEditing={() => {
								setFocus('topic');
							}}
							testID='room-info-edit-view-name'
							required
						/>
						<ControlledFormTextInput
							control={control}
							name='topic'
							label={I18n.t('Topic')}
							error={errors.topic?.message}
							onSubmitEditing={() => {
								setFocus('announcement');
							}}
							testID='room-info-edit-view-topic'
							textContentType='none'
							autoComplete='off'
							importantForAutofill='no'
						/>
						<ControlledFormTextInput
							control={control}
							name='announcement'
							error={errors.announcement?.message}
							onSubmitEditing={() => {
								setFocus('description');
							}}
							label={I18n.t('Announcement')}
							testID='room-info-edit-view-announcement'
							textContentType='none'
							autoComplete='off'
							importantForAutofill='no'
						/>
						<ControlledFormTextInput
							control={control}
							name='description'
							error={errors.description?.message}
							onSubmitEditing={() => {
								setFocus('joinCode');
							}}
							label={I18n.t('Description')}
							testID='room-info-edit-view-description'
							textContentType='none'
							autoComplete='off'
							importantForAutofill='no'
						/>
					</View>

					<ControlledFormTextInput
						control={control}
						name='joinCode'
						error={errors.joinCode?.message}
						onSubmitEditing={() => {
							setFocus('description');
						}}
						label={I18n.t('Room_Password')}
						secureTextEntry
						testID='room-info-edit-view-password'
						autoComplete={isAndroid ? 'new-password' : undefined}
						textContentType={isAndroid ? 'newPassword' : undefined}
						importantForAutofill={isAndroid ? 'yes' : undefined}
					/>
					<View style={styles.switches}>
						<SwitchContainer
							value={t}
							leftLabelPrimary={I18n.t('Public')}
							leftLabelSecondary={
								room.teamMain ? I18n.t('Everyone_can_access_this_team') : I18n.t('Everyone_can_access_this_channel')
							}
							onValueChange={toggleRoomType}
							testID='room-info-edit-view-t'
						/>

						<SwitchContainer
							value={readOnly}
							leftLabelPrimary={I18n.t('Read_Only')}
							leftLabelSecondary={
								room.teamMain
									? I18n.t('All_users_in_the_team_can_write_new_messages')
									: I18n.t('All_users_in_the_channel_can_write_new_messages')
							}
							onValueChange={toggleReadOnly}
							disabled={!permissions['set-readonly'] || room.broadcast}
							testID='room-info-edit-view-ro'
						/>
						{readOnly && !room.broadcast ? (
							<SwitchContainer
								value={reactWhenReadOnly as boolean}
								leftLabelPrimary={I18n.t('No_Reactions')}
								leftLabelSecondary={I18n.t('Reactions_are_disabled')}
								onValueChange={toggleReactions}
								disabled={!permissions['set-react-when-readonly']}
								testID='room-info-edit-view-react-when-ro'
							/>
						) : null}
						{room.broadcast
							? [
									<Text style={styles.broadcast}>{I18n.t('Broadcast')}</Text>,
									<View style={[styles.divider, { borderColor: colors.strokeLight }]} />
							  ]
							: null}
						{serverVersion && !compareServerVersion(serverVersion, 'lowerThan', '3.0.0') ? (
							<SwitchContainer
								value={enableSysMes as boolean}
								leftLabelPrimary={I18n.t('Hide_System_Messages')}
								testID='room-info-edit-switch-system-messages'
								onValueChange={toggleHideSystemMessages}
								labelContainerStyle={styles.hideSystemMessages}
								leftLabelStyle={styles.systemMessagesLabel}>
								{renderSystemMessages()}
							</SwitchContainer>
						) : null}
						{encryptionEnabled ? (
							<SwitchContainer
								value={encrypted as boolean}
								disabled={!t}
								leftLabelPrimary={I18n.t('Encrypted')}
								leftLabelSecondary={I18n.t('End_to_end_encrypted_room')}
								testID='room-info-edit-switch-encrypted'
								onValueChange={toggleEncrypted}
								labelContainerStyle={styles.hideSystemMessages}
								leftLabelStyle={styles.systemMessagesLabel}
							/>
						) : null}
					</View>
					<Button
						title={I18n.t('Save_Changes')}
						onPress={submit}
						disabled={!isDirty}
						testID='room-info-edit-view-submit'
						style={{ marginBottom: 0 }}
					/>
					<View style={[styles.divider, { borderColor: colors.strokeLight }]} />

					<Button
						backgroundColor={colors.buttonBackgroundSecondaryDefault}
						title={I18n.t('RESET')}
						onPress={onResetPress}
						disabled={!isDirty}
						testID='room-info-edit-view-reset'
					/>
					<Button
						backgroundColor={colors.buttonBackgroundSecondaryDefault}
						color={colors.fontTitlesLabels}
						title={archived ? I18n.t('UNARCHIVE') : I18n.t('ARCHIVE')}
						onPress={toggleArchive}
						disabled={archived ? !permissions['unarchive-room'] : !permissions['archive-room']}
						testID={archived ? 'room-info-edit-view-unarchive' : 'room-info-edit-view-archive'}
						style={{ marginBottom: 0 }}
					/>

					<View style={[styles.divider, { borderColor: colors.strokeLight }]} />
					<Button
						color={colors.buttonFontSecondaryDanger}
						backgroundColor={colors.buttonBackgroundSecondaryDefault}
						title={I18n.t('Delete')}
						onPress={onDeletePress}
						disabled={!hasDeletePermission()}
						testID='room-info-edit-view-delete'
					/>
				</ScrollView>
			</SafeAreaView>
		</KeyboardView>
	);
};

export default RoomInfoEditView;
