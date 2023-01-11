import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import ImagePicker, { Image } from 'react-native-image-crop-picker';
import { shallowEqual } from 'react-redux';

import { compareServerVersion } from '../../lib/methods/helpers';
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
import AvatarUrl from './AvatarUrl';
import Button from '../../containers/Button';
import I18n from '../../i18n';
import { ChatsStackParamList } from '../../stacks/types';
import { IAvatar } from '../../definitions';
import { Services } from '../../lib/services';
import AvatarSuggestion from './AvatarSuggestion';
import log from '../../lib/methods/helpers/log';

const RESET_ROOM_AVATAR = 'resetRoomAvatar';

const ChangeAvatarView = () => {
	const [avatar, setAvatarState] = useState<IAvatar | null>(null);

	const [textAvatar, setTextAvatar] = useState('');
	const [saving, setSaving] = useState(false);
	const { colors } = useTheme();
	const { userId, username, serverVersion } = useAppSelector(
		state => ({
			userId: getUserSelector(state).id,
			username: getUserSelector(state).username,
			serverVersion: state.server.version
		}),
		shallowEqual
	);

	const avatarUrl = useRef<string>('');

	const navigation = useNavigation<StackNavigationProp<ChatsStackParamList, 'ChangeAvatarView'>>();
	const { context, titleHeader, room, t } = useRoute<RouteProp<ChatsStackParamList, 'ChangeAvatarView'>>().params;

	useLayoutEffect(() => {
		navigation.setOptions({
			title: titleHeader || I18n.t('Avatar')
		});
	}, [titleHeader, navigation]);

	useEffect(() => {
		navigation.addListener('beforeRemove', e => {
			if (!avatarUrl.current) {
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

	const setAvatar = (value: IAvatar | null) => {
		avatarUrl.current = value?.url || '';
		setAvatarState(value);
	};

	const submit = async () => {
		let result;
		if (context === 'room' && room?.rid) {
			// Change Rooms Avatar
			result = await changeRoomsAvatar(room.rid);
		} else if (avatar?.url) {
			// Change User's Avatar
			result = await changeUserAvatar(avatar);
		} else if (textAvatar) {
			// Change User's Avatar
			result = await resetUserAvatar();
		}
		if (result) {
			setSaving(false);
			avatarUrl.current = '';
			return navigation.goBack();
		}
	};

	const changeRoomsAvatar = async (rid: string) => {
		try {
			setSaving(true);
			await Services.saveRoomSettings(rid, { roomAvatar: avatar?.data });
			return true;
		} catch (e) {
			log(e);
			setSaving(false);
			return handleError(e, 'saveRoomSettings', 'changing_avatar');
		}
	};

	const changeUserAvatar = async (avatarUpload: IAvatar) => {
		try {
			setSaving(true);
			await Services.setAvatarFromService(avatarUpload);
			return true;
		} catch (e) {
			log(e);
			setSaving(false);
			return handleError(e, 'resetAvatar', 'changing_avatar');
		}
	};

	const resetUserAvatar = async () => {
		try {
			await Services.resetAvatar(userId);
			return true;
		} catch (e) {
			return handleError(e, 'setAvatarFromService', 'changing_avatar');
		}
	};

	const handleError = (e: any, _func: string, action: string) => {
		if (e.data && e.data.error.includes('[error-too-many-requests]')) {
			return showErrorAlert(e.data.error);
		}
		if (e.error && e.error === 'error-avatar-invalid-url') {
			return showErrorAlert(I18n.t(e.error, { url: e.details.url }));
		}
		if (I18n.isTranslated(e.error)) {
			return showErrorAlert(I18n.t(e.error));
		}
		showErrorAlert(I18n.t('There_was_an_error_while_action', { action: I18n.t(action) }));
	};

	const resetAvatar = () => {
		setAvatar(null);
		setTextAvatar(`@${username}`);
		avatarUrl.current = `@${username}`;
	};

	const resetRoomAvatar = () => {
		setAvatar({ data: null });
		avatarUrl.current = RESET_ROOM_AVATAR;
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
			setAvatar({ url: response.path, data: `data:image/jpeg;base64,${response.data}`, service: 'upload' });
		} catch (error) {
			log(error);
		}
	};

	const ridProps = avatarUrl.current !== RESET_ROOM_AVATAR ? { rid: room?.rid } : {};

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
						<Avatar
							text={room?.name || textAvatar || username}
							avatar={avatar?.url}
							isStatic={avatar?.url}
							size={100}
							type={t}
							{...ridProps}
						/>
					</View>
					{context === 'profile' ? <AvatarUrl submit={value => setAvatar({ url: value, data: value, service: 'url' })} /> : null}
					<List.Separator style={styles.separator} />
					{context === 'profile' ? <AvatarSuggestion resetAvatar={resetAvatar} username={username} onPress={setAvatar} /> : null}

					<Button
						title={I18n.t('Upload_image')}
						type='secondary'
						disabled={saving}
						backgroundColor={colors.editAndUploadButtonAvatar}
						onPress={pickImage}
						testID='change-avatar-view-logout-other-locations'
					/>
					{context === 'room' && serverVersion && compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.6.0') ? (
						<Button
							title={I18n.t('Delete_image')}
							type='primary'
							disabled={saving}
							backgroundColor={colors.dangerColor}
							onPress={resetRoomAvatar}
							testID='change-avatar-view-delete-my-account'
						/>
					) : null}
					<Button
						title={I18n.t('Save')}
						disabled={!avatarUrl.current || saving}
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
