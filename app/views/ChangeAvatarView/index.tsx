import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import ImagePicker, { Image } from 'react-native-image-crop-picker';

import { compareServerVersion } from '../../lib/methods/helpers';
import KeyboardView from '../../containers/KeyboardView';
import sharedStyles from '../Styles';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import { showConfirmationAlert, handleError } from '../../lib/methods/helpers/info';
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

const ChangeAvatarView = () => {
	const [avatar, setAvatarState] = useState<IAvatar | null>(null);

	const [textAvatar, setTextAvatar] = useState('');
	const [saving, setSaving] = useState(false);
	const { colors } = useTheme();
	const { user, serverVersion } = useAppSelector(state => ({
		user: getUserSelector(state),
		isMasterDetail: state.app.isMasterDetail,
		serverVersion: state.server.version
	}));

	const avatarUrl = useRef<string | undefined>('');

	const navigation = useNavigation<StackNavigationProp<ChatsStackParamList, 'ChangeAvatarView'>>();
	const { fromUser, titleHeader, room, t } = useRoute<RouteProp<ChatsStackParamList, 'ChangeAvatarView'>>().params;

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
		avatarUrl.current = value?.url;
		setAvatarState(value);
	};

	const submit = async () => {
		try {
			setSaving(true);
			if (!fromUser && room?.rid) {
				// Change Rooms Avatar
				await Services.saveRoomSettings(room.rid, { roomAvatar: avatar?.data });
			} else if (avatar?.url) {
				// Change User's Avatar
				await Services.setAvatarFromService(avatar);
			} else if (textAvatar) {
				// Change User's Avatar
				await Services.resetAvatar(user.id);
			}
			setSaving(false);
			avatarUrl.current = '';
			return navigation.goBack();
		} catch (e) {
			log(e);
			setSaving(false);
			if (!fromUser && room?.rid) {
				return handleError(e, 'saveRoomSettings', 'changing_avatar');
			}
			if (textAvatar) {
				return handleError(e, 'resetAvatar', 'changing_avatar');
			}
			return handleError(e, 'setAvatarFromService', 'changing_avatar');
		}
	};

	const resetAvatar = () => {
		setAvatar(null);
		setTextAvatar(`@${user.username}`);
		avatarUrl.current = `@${user.username}`;
	};

	const resetRoomAvatar = () => {
		setAvatar({ data: null });
		avatarUrl.current = 'resetRoomAvatar';
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

	const ridProps = avatarUrl.current !== 'resetRoomAvatar' ? { rid: room?.rid } : {};

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
							text={room?.name || textAvatar || user.username}
							avatar={avatar?.url}
							isStatic={avatar?.url}
							size={100}
							type={t}
							{...ridProps}
						/>
					</View>
					{fromUser ? <AvatarUrl submit={value => setAvatar({ url: value, data: value, service: 'url' })} /> : null}
					<List.Separator style={styles.separator} />
					{fromUser ? <AvatarSuggestion resetAvatar={resetAvatar} user={user} onPress={setAvatar} /> : null}

					<Button
						title={I18n.t('Upload_image')}
						type='secondary'
						disabled={saving}
						backgroundColor={colors.editAndUploadButtonAvatar}
						onPress={pickImage}
						testID='change-avatar-view-logout-other-locations'
					/>
					{!fromUser && serverVersion && compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '3.6.0') ? (
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
