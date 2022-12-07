import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

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
	const [avatar, setAvatarState] = useState<IAvatar>();
	const [avatarSuggestions, setAvatarSuggestions] = useState<IAvatar[]>([]);
	const [textAvatar, setTextAvatar] = useState('');
	const [saving, setSaving] = useState(false);
	const { colors } = useTheme();
	const { user } = useAppSelector(state => ({
		user: getUserSelector(state),
		isMasterDetail: state.app.isMasterDetail
	}));

	const avatarUrl = useRef<string | undefined>('');

	const navigation = useNavigation<StackNavigationProp<ChatsStackParamList, 'ChangeAvatarView'>>();
	const { fromUser, titleHeader } = useRoute<RouteProp<ChatsStackParamList, 'ChangeAvatarView'>>().params;

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

	const getAvatarSuggestion = async () => {
		const result = await Services.getAvatarSuggestion();
		const suggestions = Object.keys(result).map(service => {
			const { url, blob, contentType } = result[service];
			return {
				url,
				data: blob,
				service,
				contentType
			};
		});
		setAvatarSuggestions(suggestions);
	};

	useEffect(() => {
		if (fromUser) {
			getAvatarSuggestion();
		}
	}, [fromUser]);

	const setAvatar = (value?: IAvatar) => {
		avatarUrl.current = value?.url;
		setAvatarState(value);
	};

	const submit = async () => {
		if (avatar?.url) {
			try {
				setSaving(true);
				await Services.setAvatarFromService(avatar);
				setSaving(false);
				avatarUrl.current = '';
				return navigation.goBack();
			} catch (e) {
				log(e);
				setSaving(false);
				return handleError(e, 'setAvatarFromService', 'changing_avatar');
			}
		}

		if (textAvatar) {
			try {
				setSaving(true);
				await Services.resetAvatar(user.id);
				setSaving(false);
				avatarUrl.current = '';
				return navigation.goBack();
			} catch (e) {
				setSaving(false);
				handleError(e, 'resetAvatar', 'changing_avatar');
			}
		}
	};

	const resetAvatar = () => {
		setAvatar(undefined);
		setTextAvatar(`@${user.username}`);
		avatarUrl.current = `@${user.username}`;
	};

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
						<Avatar text={textAvatar || user.username} avatar={avatar?.url} isStatic={avatar?.url} size={100} />
					</View>
					<AvatarUrl submit={value => setAvatar({ url: value, data: value, service: 'url' })} />
					<List.Separator style={styles.separator} />
					{fromUser && avatarSuggestions.length ? (
						<AvatarSuggestion resetAvatar={resetAvatar} user={user} onPress={setAvatar} avatarSuggestions={avatarSuggestions} />
					) : null}

					<Button
						title={I18n.t('Upload_image')}
						type='secondary'
						disabled={saving}
						backgroundColor={colors.chatComponentBackground}
						onPress={() => {}}
						testID='change-avatar-view-logout-other-locations'
					/>
					{!fromUser ? (
						<Button
							title={I18n.t('Delete_image')}
							type='primary'
							disabled={saving}
							backgroundColor={colors.dangerColor}
							onPress={() => {}}
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
