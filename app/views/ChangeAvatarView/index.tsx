import React, { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { shallowEqual } from 'react-redux';

import KeyboardView from '../../containers/KeyboardView';
import sharedStyles from '../Styles';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import { showConfirmationAlert, showErrorAlert } from '../../lib/methods/helpers/info';
import StatusBar from '../../containers/StatusBar';
import { useTheme } from '../../theme';
import SafeAreaView from '../../containers/SafeAreaView';
import * as List from '../../containers/List';
import styles from './styles';
import { useAppSelector } from '../../lib/hooks';
import { getUserSelector } from '../../selectors/login';
import Avatar from '../../containers/Avatar';
import AvatarPresentational from '../../containers/Avatar/Avatar';
import AvatarUrl from './AvatarUrl';
import Button from '../../containers/Button';
import I18n from '../../i18n';
import { ChatsStackParamList } from '../../stacks/types';
import { IAvatar } from '../../definitions';
import AvatarSuggestion from './AvatarSuggestion';
import log from '../../lib/methods/helpers/log';
import { changeRoomsAvatar, changeUserAvatar, resetUserAvatar } from './submitServices';
import ImagePicker, { Image } from './ImagePicker';

enum AvatarStateActions {
	CHANGE_AVATAR = 'CHANGE_AVATAR',
	RESET_USER_AVATAR = 'RESET_USER_AVATAR',
	RESET_ROOM_AVATAR = 'RESET_ROOM_AVATAR'
}

interface IReducerAction {
	type: AvatarStateActions;
	payload?: Partial<IState>;
}

interface IState extends IAvatar {
	resetUserAvatar: string;
}

const initialState = {
	data: '',
	url: '',
	contentType: '',
	service: '',
	resetUserAvatar: ''
};

function reducer(state: IState, action: IReducerAction) {
	const { type, payload } = action;
	if (type in AvatarStateActions) {
		return {
			...initialState,
			...payload
		};
	}
	return state;
}

const ChangeAvatarView = () => {
	const [state, dispatch] = useReducer(reducer, initialState);
	const [saving, setSaving] = useState(false);
	const { colors } = useTheme();
	const { userId, username, server } = useAppSelector(
		state => ({
			userId: getUserSelector(state).id,
			username: getUserSelector(state).username,
			server: state.server.server
		}),
		shallowEqual
	);
	const isDirty = useRef<boolean>(false);
	const navigation = useNavigation<StackNavigationProp<ChatsStackParamList, 'ChangeAvatarView'>>();
	const { context, titleHeader, room, t } = useRoute<RouteProp<ChatsStackParamList, 'ChangeAvatarView'>>().params;

	useLayoutEffect(() => {
		navigation.setOptions({
			title: titleHeader || I18n.t('Avatar')
		});
	}, [titleHeader, navigation]);

	useEffect(() => {
		navigation.addListener('beforeRemove', e => {
			if (!isDirty.current) {
				return;
			}

			e.preventDefault();

			showConfirmationAlert({
				title: I18n.t('Discard_changes'),
				message: I18n.t('Discard_changes_description'),
				confirmationText: I18n.t('Discard'),
				onPress: () => {
					navigation.dispatch(e.data.action);
				}
			});
		});
	}, [navigation]);

	const dispatchAvatar = (action: IReducerAction) => {
		isDirty.current = true;
		dispatch(action);
	};

	const submit = async () => {
		try {
			setSaving(true);
			if (context === 'room' && room?.rid) {
				// Change Rooms Avatar
				await changeRoomsAvatar(room.rid, state?.data);
			} else if (state?.url) {
				// Change User's Avatar
				await changeUserAvatar(state);
			} else if (state.resetUserAvatar) {
				// Change User's Avatar
				await resetUserAvatar(userId);
			}
			isDirty.current = false;
		} catch (e: any) {
			log(e);
			return showErrorAlert(e.message, I18n.t('Oops'));
		} finally {
			setSaving(false);
		}
		return navigation.goBack();
	};

	const pickImage = async () => {
		const options = {
			cropping: true,
			compressImageQuality: 0.8,
			freeStyleCropEnabled: true,
			cropperAvoidEmptySpaceAroundImage: false,
			cropperChooseText: I18n.t('Choose'),
			cropperCancelText: I18n.t('Cancel'),
			includeBase64: true
		};
		try {
			const response: Image = await ImagePicker.openPicker(options);
			dispatchAvatar({
				type: AvatarStateActions.CHANGE_AVATAR,
				payload: { url: response.path, data: `data:image/jpeg;base64,${response.data}`, service: 'upload' }
			});
		} catch (error) {
			log(error);
		}
	};

	const deletingRoomAvatar = context === 'room' && state.data === null;

	return (
		<KeyboardView
			style={{ backgroundColor: colors.auxiliaryBackground }}
			contentContainerStyle={sharedStyles.container}
			keyboardVerticalOffset={128}
		>
			<StatusBar />
			<SafeAreaView testID='change-avatar-view'>
				<ScrollView
					contentContainerStyle={sharedStyles.containerScrollView}
					testID='change-avatar-view-list'
					{...scrollPersistTaps}
				>
					<View style={styles.avatarContainer} testID='change-avatar-view-avatar'>
						{deletingRoomAvatar ? (
							<AvatarPresentational
								text={room?.name || state.resetUserAvatar || username}
								avatar={state?.url}
								isStatic={state?.url}
								size={120}
								type={t}
								server={server}
							/>
						) : (
							<Avatar
								text={room?.name || state.resetUserAvatar || username}
								avatar={state?.url}
								isStatic={state?.url}
								size={120}
								type={t}
								rid={room?.rid}
							/>
						)}
					</View>
					{context === 'profile' ? (
						<AvatarUrl
							submit={value =>
								dispatchAvatar({
									type: AvatarStateActions.CHANGE_AVATAR,
									payload: { url: value, data: value, service: 'url' }
								})
							}
						/>
					) : null}
					<List.Separator style={styles.separator} />
					{context === 'profile' ? (
						<AvatarSuggestion
							resetAvatar={() =>
								dispatchAvatar({
									type: AvatarStateActions.RESET_USER_AVATAR,
									payload: { resetUserAvatar: `@${username}` }
								})
							}
							username={username}
							onPress={value =>
								dispatchAvatar({
									type: AvatarStateActions.CHANGE_AVATAR,
									payload: value
								})
							}
						/>
					) : null}
					<Button
						title={I18n.t('Upload_image')}
						type='secondary'
						disabled={saving}
						backgroundColor={colors.editAndUploadButtonAvatar}
						onPress={pickImage}
						testID='change-avatar-view-upload-image'
					/>
					{context === 'room' ? (
						<Button
							title={I18n.t('Delete_image')}
							type='primary'
							disabled={saving}
							backgroundColor={colors.dangerColor}
							onPress={() => dispatchAvatar({ type: AvatarStateActions.RESET_ROOM_AVATAR, payload: { data: null } })}
							testID='change-avatar-view-delete-my-account'
						/>
					) : null}
					<Button
						title={I18n.t('Save')}
						disabled={!isDirty.current || saving}
						type='primary'
						loading={saving}
						onPress={submit}
						testID='change-avatar-view-submit'
					/>
				</ScrollView>
			</SafeAreaView>
		</KeyboardView>
	);
};

export default ChangeAvatarView;
