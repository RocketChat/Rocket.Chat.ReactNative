import React, { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { shallowEqual } from 'react-redux';
import { useForm } from 'react-hook-form';
import { HeaderBackButton } from '@react-navigation/elements';
import type { ImagePickerOptions } from 'expo-image-picker';

import { textInputDebounceTime } from '../../lib/constants';
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
import Button from '../../containers/Button';
import I18n from '../../i18n';
import { ChatsStackParamList } from '../../stacks/types';
import { IAvatar } from '../../definitions';
import AvatarSuggestion from './AvatarSuggestion';
import log from '../../lib/methods/helpers/log';
import { changeRoomsAvatar, changeUserAvatar, resetUserAvatar } from './submitServices';
import ImagePicker from '../../lib/methods/helpers/ImagePicker/ImagePicker';
import { getPermissions } from '../../lib/methods/helpers/ImagePicker/getPermissions';
import { mapMediaResult } from '../../lib/methods/helpers/ImagePicker/mapMediaResult';
import { isImageURL, isTablet, useDebounce } from '../../lib/methods/helpers';
import { ControlledFormTextInput } from '../../containers/TextInput';

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
	const { control, getValues, setValue } = useForm({
		mode: 'onChange',
		defaultValues: { rawImageUrl: '' }
	});
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
	const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList, 'ChangeAvatarView'>>();
	const { context, titleHeader, room, t } = useRoute<RouteProp<ChatsStackParamList, 'ChangeAvatarView'>>().params;

	useLayoutEffect(() => {
		navigation.setOptions({
			title: titleHeader || I18n.t('Avatar'),
			headerLeft: () => (
				<HeaderBackButton
					labelVisible={false}
					onPress={() => navigation.goBack()}
					tintColor={colors.fontDefault}
					testID='header-back'
					style={{ margin: 0, marginRight: isTablet ? 5 : -5, marginLeft: -12 }}
				/>
			)
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

	const onChangeText = useDebounce(async (value: string) => {
		const { rawImageUrl } = getValues();
		const result = await isImageURL(rawImageUrl);

		if (!result || !value) {
			dispatchAvatar({
				type: AvatarStateActions.RESET_USER_AVATAR,
				payload: { resetUserAvatar: `@${username}` }
			});
		}

		setValue('rawImageUrl', value);
	}, textInputDebounceTime);

	const fetchImageFromURL = async () => {
		const { rawImageUrl } = getValues();
		const result = await isImageURL(rawImageUrl);
		if (result) {
			dispatchAvatar({
				type: AvatarStateActions.CHANGE_AVATAR,
				payload: { url: rawImageUrl, data: rawImageUrl, service: 'url' }
			});
		}
	};

	const submit = async () => {
		try {
			setSaving(true);
			if (context === 'room' && room?.rid) {
				// Change Rooms Avatar
				await changeRoomsAvatar(room.rid, state?.data);
			} else if (state?.url || state?.data) {
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

	const pickImage = async (isCam = false) => {
		try {
			const options: ImagePickerOptions = {
				exif: true,
				base64: true
			};
			await getPermissions(isCam ? 'camera' : 'library');
			const response = isCam ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
			if (response.canceled) {
				return;
			}
			const [media] = mapMediaResult(response.assets);
			dispatchAvatar({
				type: AvatarStateActions.CHANGE_AVATAR,
				payload: { url: media.path, data: `data:image/jpeg;base64,${media.base64}`, service: 'upload' }
			});
		} catch (error: any) {
			if (error?.code !== 'E_PICKER_CANCELLED') {
				log(error);
			}
		}
	};

	const deletingRoomAvatar = context === 'room' && state.data === null;

	return (
		<KeyboardView contentContainerStyle={sharedStyles.container} keyboardVerticalOffset={128}>
			<StatusBar />
			<SafeAreaView testID='change-avatar-view'>
				<ScrollView
					contentContainerStyle={{ ...sharedStyles.containerScrollView, paddingTop: 32 }}
					testID='change-avatar-view-list'
					{...scrollPersistTaps}>
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
						<>
							<ControlledFormTextInput
								control={control}
								name='rawImageUrl'
								label={I18n.t('Avatar_Url')}
								onChangeText={onChangeText}
								testID='change-avatar-view-avatar-url'
								containerStyle={{ marginBottom: 0 }}
							/>
							<Button
								title={I18n.t('Fetch_image_from_URL')}
								type='secondary'
								disabled={saving}
								backgroundColor={colors.buttonBackgroundSecondaryDefault}
								onPress={fetchImageFromURL}
								testID='change-avatar-view-take-a-photo'
								style={{ marginTop: 36, marginBottom: 0 }}
							/>
						</>
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
					<View style={styles.buttons}>
						<Button
							title={I18n.t('Take_a_photo')}
							type='secondary'
							disabled={saving}
							backgroundColor={colors.buttonBackgroundSecondaryDefault}
							onPress={() => pickImage(true)}
							testID='change-avatar-view-take-a-photo'
							style={styles.containerInput}
						/>
						<Button
							title={I18n.t('Upload_image')}
							type='secondary'
							disabled={saving}
							backgroundColor={colors.buttonBackgroundSecondaryDefault}
							onPress={() => pickImage()}
							testID='change-avatar-view-upload-image'
							style={styles.containerInput}
						/>
						{context === 'room' ? (
							<Button
								title={I18n.t('Delete_image')}
								type='primary'
								disabled={saving}
								backgroundColor={colors.buttonBackgroundDangerDefault}
								onPress={() => dispatchAvatar({ type: AvatarStateActions.RESET_ROOM_AVATAR, payload: { data: null } })}
								testID='change-avatar-view-delete-my-account'
								style={styles.containerInput}
							/>
						) : null}
						<Button
							title={I18n.t('Save')}
							disabled={!isDirty.current || saving}
							type='primary'
							loading={saving}
							onPress={submit}
							testID='change-avatar-view-submit'
							style={styles.containerInput}
						/>
					</View>
				</ScrollView>
			</SafeAreaView>
		</KeyboardView>
	);
};

export default ChangeAvatarView;
