import React from 'react';
import PropTypes from 'prop-types';
import {
	View, TouchableOpacity
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';

import Avatar from '../../containers/Avatar';
import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import I18n from '../../i18n';


class RoomAvatarEditor extends React.Component {
	static propTypes = {
		room: PropTypes.object,
		t: PropTypes.string,
		baseUrl: PropTypes.string,
		user: PropTypes.object,
		avatarUpdated: PropTypes.bool,
		avatar: PropTypes.object,
		setAvatar: PropTypes.func
	};

	pickImage = async() => {
		const { setAvatar } = this.props;
		const options = {
			cropping: true,
			compressImageQuality: 0.8,
			cropperAvoidEmptySpaceAroundImage: false,
			cropperChooseText: I18n.t('Choose'),
			cropperCancelText: I18n.t('Cancel'),
			includeBase64: true
		};
		try {
			const response = await ImagePicker.openPicker(options);
			setAvatar({ url: response.path, data: `data:image/jpeg;base64,${ response.data }`, service: 'upload' });
		} catch (error) {
			console.warn(error);
		}
	}

	avatarButtons = () => {
		const { setAvatar } = this.props;
		return (
			<View style={styles.avatarButtonsContainer}>
				<TouchableOpacity
					onPress={() => this.pickImage()}
					style={styles.avatarUpload}
				>
					<CustomIcon name='upload' size={20} color='black' />
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => setAvatar(null)}
					style={styles.avatarReset}
				>
					<CustomIcon name='delete' size={20} color='white' />
				</TouchableOpacity>
			</View>
		);
	}

	renderAvatar = ({
		text, roomId, localUri, type
	}) => {
		const {
			baseUrl, user
		} = this.props;

		return (
			<Avatar
				text={text}
				localUri={localUri}
				size={150}
				style={styles.avatar}
				baseUrl={baseUrl}
				userId={user.id}
				token={user.token}
				roomId={roomId}
				type={type}
			>
				{this.avatarButtons()}
			</Avatar>
		);
	}

	avatarUpdated({ localUri, text }) {
		const {
			avatar
		} = this.props;

		return avatar ? this.renderAvatar({ localUri }) : this.renderAvatar({ text });
	}

	render() {
		const {
			room, t, avatarUpdated, avatar
		} = this.props;
		const { rid, name } = room;

		return (
			<>{!avatarUpdated ? this.renderAvatar({ text: name, type: t, roomId: rid }) : this.avatarUpdated({ localUri: avatar?.url, text: `@${ name }` })}</>
		);
	}
}

export default RoomAvatarEditor;
