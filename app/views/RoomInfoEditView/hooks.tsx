import React, { useLayoutEffect } from 'react';
import { Q } from '@nozbe/watermelondb';
import { BlockContext } from '@rocket.chat/ui-kit';
import { dequal } from 'dequal';
import { Alert, Keyboard, ScrollView, Text, TextInput, View } from 'react-native';
import { connect } from 'react-redux';
import { Subscription } from 'rxjs';

import { useAppSelector } from '../../lib/hooks';
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
import { useTheme, withTheme } from '../../theme';
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
	random,
	isAndroid
} from '../../lib/methods/helpers';
import { Services } from '../../lib/services';
import Button from '../../containers/Button';

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
		isMasterDetail,
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
		deleteTeamPermission: state.permissions['delete-team'] as string[],
		isMasterDetail: state.app.isMasterDetail
	}));

	const handleEditAvatar = () => {
		navigation.navigate('ChangeAvatarView', { titleHeader: I18n.t('Room_Info'), room, t: room.t, context: 'room' });
	};

	const toggleRoomType = (value: boolean) => {
		logEvent(events.RI_EDIT_TOGGLE_ROOM_TYPE);
		//	this.setState(({ encrypted }) => ({ t: value, encrypted: value && encrypted }));
	};

	const toggleReadOnly = (value: boolean) => {
		logEvent(events.RI_EDIT_TOGGLE_READ_ONLY);
		// this.setState({ ro: value });
	};

	const toggleReactions = (value: boolean) => {
		logEvent(events.RI_EDIT_TOGGLE_REACTIONS);
		// this.setState({ reactWhenReadOnly: value });
	};

	const toggleHideSystemMessages = (value: boolean) => {
		logEvent(events.RI_EDIT_TOGGLE_SYSTEM_MSG);
		// this.setState(({ systemMessages }) => ({ enableSysMes: value, systemMessages: value ? systemMessages : [] }));
	};

	const toggleEncrypted = (value: boolean) => {
		logEvent(events.RI_EDIT_TOGGLE_ENCRYPTED);
		// this.setState({ encrypted: value });
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
							handleEdit={this.handleEditAvatar}
						/>
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
							textContentType='none'
							autoComplete='off'
							importantForAutofill='no'
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
							textContentType='none'
							autoComplete='off'
							importantForAutofill='no'
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
							textContentType='none'
							autoComplete='off'
							importantForAutofill='no'
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
									<View style={[styles.divider, { borderColor: colors.strokeLight }]} />
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
					<View style={[styles.divider, { borderColor: colors.strokeLight }]} />

					<Button
						backgroundColor={colors.buttonBackgroundSecondaryDefault}
						title={I18n.t('RESET')}
						onPress={this.reset}
						disabled={!this.formIsChanged()}
						testID='room-info-edit-view-reset'
					/>
					<Button
						backgroundColor={colors.buttonBackgroundSecondaryDefault}
						color={colors.fontTitlesLabels}
						title={archived ? I18n.t('UNARCHIVE') : I18n.t('ARCHIVE')}
						onPress={this.toggleArchive}
						disabled={archived ? !permissions['unarchive-room'] : !permissions['archive-room']}
						testID={archived ? 'room-info-edit-view-unarchive' : 'room-info-edit-view-archive'}
						style={{ marginBottom: 0 }}
					/>

					<View style={[styles.divider, { borderColor: colors.strokeLight }]} />
					<Button
						color={colors.buttonFontSecondaryDanger}
						backgroundColor={colors.buttonBackgroundSecondaryDefault}
						title={I18n.t('Delete')}
						onPress={room.teamMain ? this.deleteTeam : this.delete}
						disabled={!this.hasDeletePermission()}
						testID='room-info-edit-view-delete'
					/>
				</ScrollView>
			</SafeAreaView>
		</KeyboardView>
	);
};

export default RoomInfoEditView;
