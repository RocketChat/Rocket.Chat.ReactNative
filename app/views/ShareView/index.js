import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, TouchableOpacity, TextInput, Image
} from 'react-native';
import { connect } from 'react-redux';
import ShareExtension from 'rn-extensions-share';
import { HeaderBackButton } from 'react-navigation';

import {
	COLOR_TEXT_DESCRIPTION, HEADER_BACK
} from '../../constants/colors';
import I18n from '../../i18n';
import RocketChat from '../../lib/rocketchat';
import { CustomIcon } from '../../lib/Icons';
import log from '../../utils/log';
import styles from './styles';
import Loading from './Loading';
import { isIOS } from '../../utils/deviceInfo';
import database from '../../lib/realm';

@connect(state => ({
	user: {
		username: state.login.user && state.login.user.username
	}
}))
export default class ShareView extends React.Component {
	static navigationOptions = ({ navigation }) => {
		const canSend = navigation.getParam('canSend', false);

		return ({
			headerLeft: (
				<HeaderBackButton
					title={I18n.t('Back')}
					backTitleVisible={isIOS}
					onPress={() => navigation.goBack()}
					tintColor={HEADER_BACK}
				/>
			),
			title: I18n.t('Share'),
			headerRight:
				canSend
					? (
						<TouchableOpacity onPress={navigation.getParam('sendMessage')} style={styles.sendButton}>
							<Text style={styles.send}>{I18n.t('Send')}</Text>
						</TouchableOpacity>
					)
					: null
		});
	}

	static propTypes = {
		navigation: PropTypes.object,
		user: PropTypes.shape({
			username: PropTypes.string.isRequired
		})
	};

	constructor(props) {
		super(props);
		const { navigation } = this.props;
		const rid = navigation.getParam('rid', '');
		const name = navigation.getParam('name', '');
		const value = navigation.getParam('value', '');
		const isMedia = navigation.getParam('isMedia', false);
		const fileInfo = navigation.getParam('fileInfo', {});

		this.rooms = database.objects('subscriptions').filtered('rid = $0', rid);

		this.state = {
			rid,
			value,
			isMedia,
			name,
			fileInfo,
			loading: false,
			room: this.rooms[0] || { rid },
			file: {
				name: fileInfo ? fileInfo.name : '',
				description: ''
			}
		};
	}

	componentDidMount() {
		const { navigation } = this.props;
		navigation.setParams({ sendMessage: this._sendMessage, canSend: !(this.isReadOnly() || this.isBlocked()) });
	}

	isOwner = () => {
		const { room } = this.state;
		return room && room.roles && room.roles.length && !!room.roles.find(role => role === 'owner');
	}

	isMuted = () => {
		const { room } = this.state;
		const { user } = this.props;
		return room && room.muted && room.muted.find && !!room.muted.find(m => m === user.username);
	}

	isReadOnly = () => {
		const { room } = this.state;
		if (this.isOwner()) {
			return false;
		}
		return (room && room.ro) || this.isMuted();
	}

	isBlocked = () => {
		const { room } = this.state;

		if (room) {
			const { t, blocked, blocker } = room;
			if (t === 'd' && (blocked || blocker)) {
				return true;
			}
		}
		return false;
	}

	bytesToSize = bits => `${ ((bits / 8) / 1048576).toFixed(2) }MB`;

	_sendMessage = async() => {
		const { isMedia } = this.state;
		this.setState({ loading: true });

		if (isMedia) {
			await this.sendMediaMessage();
		} else {
			await this.sendTextMessage();
		}

		this.setState({ loading: false });
		ShareExtension.close();
	}

	sendMediaMessage = async() => {
		const { rid, fileInfo, file } = this.state;
		const { name, description } = file;
		const fileMessage = { ...fileInfo, name, description };
		if (fileInfo && rid !== '') {
			try {
				await RocketChat.sendFileMessage(rid, fileMessage, undefined);
			} catch (e) {
				log('err_send_media_message', e);
			}
		}
	}

	sendTextMessage = async() => {
		const { value, rid } = this.state;
		if (value !== '' && rid !== '') {
			try {
				await RocketChat.sendMessage(rid, value, undefined);
			} catch (error) {
				log('err_share_extension_send_message', error);
			}
		}
	};

	renderPreview = () => {
		const { fileInfo } = this.state;

		const icon = fileInfo.type.match(/image/)
			? <Image source={{ isStatic: true, uri: fileInfo.path }} style={styles.mediaIcon} />
			: <CustomIcon name='file-generic' size={72} />;

		return (
			<View style={styles.mediaContent}>
				{icon}
				<View style={styles.mediaInfo}>
					<Text style={styles.mediaText}>{fileInfo.name}</Text>
					<Text style={styles.mediaText}>{this.bytesToSize(fileInfo.size)}</Text>
				</View>
			</View>
		);
	};

	renderMediaContent = () => {
		const { fileInfo, file } = this.state;
		return fileInfo ? (
			<View style={styles.mediaContainer}>
				{this.renderPreview()}
				<View style={styles.mediaInputContent}>
					<TextInput
						style={[styles.mediaNameInput, styles.input]}
						placeholder={I18n.t('File_name')}
						onChangeText={name => this.setState({ file: { ...file, name } })}
						underlineColorAndroid='transparent'
						defaultValue={file.name}
						placeholderTextColor={COLOR_TEXT_DESCRIPTION}
					/>
					<TextInput
						style={[styles.mediaDescriptionInput, styles.input]}
						placeholder={I18n.t('File_description')}
						onChangeText={description => this.setState({ file: { ...file, description } })}
						underlineColorAndroid='transparent'
						defaultValue={file.description}
						multiline
						textAlignVertical='top'
						placeholderTextColor={COLOR_TEXT_DESCRIPTION}
					/>
				</View>
			</View>
		) : null;
	};

	renderInput = () => {
		const { value } = this.state;
		return (
			<TextInput
				style={[styles.input, styles.textInput]}
				placeholder=''
				onChangeText={handleText => this.setState({ value: handleText })}
				underlineColorAndroid='transparent'
				defaultValue={value}
				multiline
				textAlignVertical='top'
				placeholderTextColor={COLOR_TEXT_DESCRIPTION}
			/>
		);
	}

	renderError = () => (
		<View style={[styles.container, styles.centered]}>
			<Text style={styles.title}>
				{
					this.isBlocked() ? I18n.t('This_room_is_blocked') : I18n.t('This_room_is_read_only')
				}
			</Text>
		</View>
	);

	render() {
		const {
			name, loading, isMedia
		} = this.state;

		if (this.isReadOnly() || this.isBlocked()) {
			return this.renderError();
		}

		return (
			<View style={styles.container}>
				{ loading ? <Loading /> : null }
				<View style={isMedia ? styles.toContent : styles.toContentText}>
					<Text style={styles.text}>
						<Text style={styles.to}>{`${ I18n.t('To') }: `}</Text>
						<Text style={styles.name}>{`${ name }`}</Text>
					</Text>
				</View>
				<View style={styles.content}>
					{isMedia ? this.renderMediaContent() : this.renderInput()}
				</View>
			</View>
		);
	}
}
