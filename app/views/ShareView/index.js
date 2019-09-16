import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, TextInput, Image
} from 'react-native';
import { connect } from 'react-redux';
import ShareExtension from 'rn-extensions-share';

import {
	COLOR_TEXT_DESCRIPTION
} from '../../constants/colors';
import I18n from '../../i18n';
import RocketChat from '../../lib/rocketchat';
import { CustomIcon } from '../../lib/Icons';
import log from '../../utils/log';
import styles from './styles';
import Loading from './Loading';
import { CustomHeaderButtons, Item } from '../../containers/HeaderButton';
import { isReadOnly, isBlocked } from '../../utils/room';

class ShareView extends React.Component {
	static navigationOptions = ({ navigation }) => {
		const canSend = navigation.getParam('canSend', true);

		return ({
			title: I18n.t('Share'),
			headerRight:
				canSend
					? (
						<CustomHeaderButtons>
							<Item
								title={I18n.t('Send')}
								onPress={navigation.getParam('sendMessage')}
								testID='send-message-share-view'
								buttonStyle={styles.send}
							/>
						</CustomHeaderButtons>
					)
					: null
		});
	}

	static propTypes = {
		navigation: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string.isRequired,
			username: PropTypes.string.isRequired,
			token: PropTypes.string.isRequired
		}),
		baseUrl: PropTypes.string.isRequired
	};

	constructor(props) {
		super(props);
		const { navigation } = this.props;
		const rid = navigation.getParam('rid', '');
		const name = navigation.getParam('name', '');
		const value = navigation.getParam('value', '');
		const isMedia = navigation.getParam('isMedia', false);
		const fileInfo = navigation.getParam('fileInfo', {});
		const room = navigation.getParam('room', { rid });

		this.state = {
			rid,
			value,
			isMedia,
			name,
			fileInfo,
			room,
			loading: false,
			file: {
				name: fileInfo ? fileInfo.name : '',
				description: ''
			}
		};
	}

	componentDidMount() {
		const { room } = this.state;
		const { navigation, user } = this.props;
		const { username } = user;
		navigation.setParams({ sendMessage: this._sendMessage, canSend: !(isReadOnly(room, { username }) || isBlocked(room)) });
	}

	bytesToSize = bytes => `${ (bytes / 1048576).toFixed(2) }MB`;

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
		const { baseUrl: server, user } = this.props;
		const { name, description } = file;
		const fileMessage = {
			name,
			description,
			size: fileInfo.size,
			type: fileInfo.mime,
			store: 'Uploads',
			path: fileInfo.path
		};
		if (fileInfo && rid !== '') {
			try {
				await RocketChat.sendFileMessage(rid, fileMessage, undefined, server, user);
			} catch (e) {
				log(e);
			}
		}
	}

	sendTextMessage = async() => {
		const { value, rid } = this.state;
		const { user } = this.props;
		if (value !== '' && rid !== '') {
			try {
				await RocketChat.sendMessage(rid, value, undefined, user);
			} catch (e) {
				log(e);
			}
		}
	};

	renderPreview = () => {
		const { fileInfo } = this.state;

		const icon = fileInfo.mime.match(/image/)
			? <Image source={{ isStatic: true, uri: fileInfo.path }} style={styles.mediaImage} />
			: (
				<View style={styles.mediaIconContainer}>
					<CustomIcon name='file-generic' style={styles.mediaIcon} />
				</View>
			);

		return (
			<View style={styles.mediaContent}>
				{icon}
				<View style={styles.mediaInfo}>
					<Text style={styles.mediaText} numberOfLines={1}>{fileInfo.name}</Text>
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
						autoFocus
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
				autoFocus
			/>
		);
	}

	renderError = () => {
		const { room } = this.state;
		return (
			<View style={[styles.container, styles.centered]}>
				<Text style={styles.title}>
					{
						isBlocked(room) ? I18n.t('This_room_is_blocked') : I18n.t('This_room_is_read_only')
					}
				</Text>
			</View>
		);
	}

	render() {
		const { user } = this.props;
		const { username } = user;
		const {
			name, loading, isMedia, room
		} = this.state;

		if (isReadOnly(room, { username }) || isBlocked(room)) {
			return this.renderError();
		}

		return (
			<View style={styles.container}>
				<View style={isMedia ? styles.toContent : styles.toContentText}>
					<Text style={styles.text} numberOfLines={1}>
						<Text style={styles.to}>{`${ I18n.t('To') }: `}</Text>
						<Text style={styles.name}>{`${ name }`}</Text>
					</Text>
				</View>
				<View style={styles.content}>
					{isMedia ? this.renderMediaContent() : this.renderInput()}
				</View>
				{ loading ? <Loading /> : null }
			</View>
		);
	}
}

const mapStateToProps = (({ share }) => ({
	user: {
		id: share.user && share.user.id,
		username: share.user && share.user.username,
		token: share.user && share.user.token
	},
	baseUrl: share ? share.server : ''
}));

export default connect(mapStateToProps)(ShareView);
