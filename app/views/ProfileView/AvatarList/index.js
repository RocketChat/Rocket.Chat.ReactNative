import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import ImagePicker from 'react-native-image-crop-picker';
import styles from './styles';
import AvatarButton from '../AvatarButton';
import Avatar from '../../../containers/Avatar';
import { LISTENER } from '../../../containers/Toast';
import EventEmitter from '../../../utils/events';
import RocketChat from '../../../lib/rocketchat';
import I18n from '../../../i18n';
import { logEvent, events } from '../../../utils/log';
import { CustomIcon } from '../../../lib/Icons';
import { themes } from '../../../constants/colors';

const AvatarList = ({
	user,
	allowUserAvatar,
	setState,
	init,
	handleError,
	theme,
	avatarUrl,
	avatarSuggestions
}) => {
	const setAvatar = (avatar) => {
		if (!allowUserAvatar) {
			return;
		}
		setState({ avatar });
	};

	const resetAvatar = async() => {
		if (!allowUserAvatar) {
			return;
		}

		try {
			await RocketChat.resetAvatar(user.id);
			EventEmitter.emit(LISTENER, { message: I18n.t('Avatar_changed_successfully') });
			init();
		} catch (e) {
			handleError(e, 'resetAvatar', 'changing_avatar');
		}
	};

	const pickImage = async() => {
		if (!allowUserAvatar) {
			return;
		}

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
			logEvent(events.PROFILE_PICK_AVATAR);
			const response = await ImagePicker.openPicker(options);
			setAvatar({ url: response.path, data: `data:image/jpeg;base64,${ response.data }`, service: 'upload' });
		} catch (error) {
			logEvent(events.PROFILE_PICK_AVATAR_F);
			console.warn(error);
		}
	};

	const pickImageWithURL = (url) => {
		logEvent(events.PROFILE_PICK_AVATAR_WITH_URL);
		setAvatar({ url, data: url, service: 'url' });
	};

	return (
		<View style={styles.avatarButtons}>
			<AvatarButton
				child={<Avatar text={`@${ user.username }`} size={50} />}
				onPress={resetAvatar}
				disabled={!allowUserAvatar}
				key='profile-view-reset-avatar'
				theme={theme}
			/>

			<AvatarButton
				child={<CustomIcon name='upload' size={30} color={themes[theme].bodyText} />}
				onPress={() => pickImage()}
				disabled={!allowUserAvatar}
				key='profile-view-upload-avatar'
				theme={theme}
			/>

			<AvatarButton
				child={<CustomIcon name='link' size={30} color={themes[theme].bodyText} />}
				onPress={() => pickImageWithURL(avatarUrl)}
				disabled={!avatarUrl}
				key='profile-view-avatar-url-button'
				theme={theme}
			/>

			{Object.keys(avatarSuggestions).map((service) => {
				const { url, blob, contentType } = avatarSuggestions[service];
				return (
					<AvatarButton
						disabled={!allowUserAvatar}
						key={`profile-view-avatar-${ service }`}
						child={<Avatar avatar={url} size={50} />}
						onPress={() => setAvatar({
							url, data: blob, service, contentType
						})}
						theme={theme}
					/>
				);
			})}
		</View>
	);
};

AvatarList.propTypes = {
	theme: PropTypes.object,
	user: PropTypes.object,
	allowUserAvatar: PropTypes.bool,
	setState: PropTypes.func,
	init: PropTypes.func,
	handleError: PropTypes.func,
	avatarUrl: PropTypes.string,
	avatarSuggestions: PropTypes.array
};


export default AvatarList;
