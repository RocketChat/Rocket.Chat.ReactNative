import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, Image } from 'react-native';
import { connect } from 'react-redux';
import ShareExtension from 'rn-extensions-share';

import { themes } from '../../constants/colors';
import I18n from '../../i18n';
import RocketChat from '../../lib/rocketchat';
import { CustomIcon } from '../../lib/Icons';
import log from '../../utils/log';
import styles from './styles';
import TextInput from '../../containers/TextInput';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { CustomHeaderButtons, Item } from '../../containers/HeaderButton';
import { isBlocked } from '../../utils/room';
import { isReadOnly } from '../../utils/isReadOnly';
import { withTheme } from '../../theme';

class ShareView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		route: PropTypes.object,
		theme: PropTypes.string,
		user: PropTypes.shape({
			id: PropTypes.string.isRequired,
			username: PropTypes.string.isRequired,
			token: PropTypes.string.isRequired
		}),
		server: PropTypes.string
	};

	constructor(props) {
		super(props);
		const { route } = this.props;
		const rid = route.params?.rid;
		const name = route.params?.name;
		const value = route.params?.value;
		const isMedia = route.params?.isMedia ?? false;
		const fileInfo = route.params?.fileInfo ?? {};
		const room = route.params?.room ?? { rid };

		this.state = {
			rid,
			value,
			isMedia,
			name,
			fileInfo,
			room,
			loading: false,
			readOnly: false,
			file: {
				name: fileInfo ? fileInfo.name : '',
				description: ''
			},
			canSend: false
		};

		this.setReadOnly();
		this.setHeader();
	}

	setHeader = () => {
		const { canSend } = this.state;
		const { navigation } = this.props;

		navigation.setOptions({
			title: I18n.t('Share'),
			headerRight:
				() => (canSend
					? (
						<CustomHeaderButtons>
							<Item
								title={I18n.t('Send')}
								onPress={this.sendMessage}
								testID='send-message-share-view'
								buttonStyle={styles.send}
							/>
						</CustomHeaderButtons>
					)
					: null)
		});
	}

	setReadOnly = async() => {
		const { room } = this.state;
		const { user } = this.props;
		const { username } = user;
		const readOnly = await isReadOnly(room, { username });

		this.setState({ readOnly, canSend: !(readOnly || isBlocked(room)) }, () => this.setHeader());
	}

	bytesToSize = bytes => `${ (bytes / 1048576).toFixed(2) }MB`;

	sendMessage = async() => {
		const { isMedia, loading } = this.state;
		if (loading) {
			return;
		}

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
		const { server, user } = this.props;
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
		const { theme } = this.props;

		const icon = fileInfo.mime.match(/image/)
			? <Image source={{ isStatic: true, uri: fileInfo.path }} style={styles.mediaImage} />
			: (
				<View style={styles.mediaIconContainer}>
					<CustomIcon name='clip' style={styles.mediaIcon} />
				</View>
			);

		return (
			<View
				style={[
					styles.mediaContent,
					{
						borderColor: themes[theme].separatorColor,
						backgroundColor: themes[theme].auxiliaryBackground
					}
				]}
			>
				{icon}
				<View style={styles.mediaInfo}>
					<Text style={[styles.mediaText, { color: themes[theme].titleText }]} numberOfLines={1}>{fileInfo.name}</Text>
					<Text style={[styles.mediaText, { color: themes[theme].titleText }]}>{this.bytesToSize(fileInfo.size)}</Text>
				</View>
			</View>
		);
	};

	renderMediaContent = () => {
		const { fileInfo, file } = this.state;
		const { theme } = this.props;
		const inputStyle = {
			backgroundColor: themes[theme].focusedBackground,
			borderColor: themes[theme].separatorColor
		};
		return fileInfo ? (
			<View style={styles.mediaContainer}>
				{this.renderPreview()}
				<View style={styles.mediaInputContent}>
					<TextInput
						inputStyle={[
							styles.mediaNameInput,
							styles.input,
							styles.firstInput,
							inputStyle
						]}
						placeholder={I18n.t('File_name')}
						onChangeText={name => this.setState({ file: { ...file, name } })}
						defaultValue={file.name}
						containerStyle={styles.inputContainer}
						theme={theme}
					/>
					<TextInput
						inputStyle={[
							styles.mediaDescriptionInput,
							styles.input,
							inputStyle
						]}
						placeholder={I18n.t('File_description')}
						onChangeText={description => this.setState({ file: { ...file, description } })}
						defaultValue={file.description}
						multiline
						textAlignVertical='top'
						autoFocus
						containerStyle={styles.inputContainer}
						theme={theme}
					/>
				</View>
			</View>
		) : null;
	};

	renderInput = () => {
		const { value } = this.state;
		const { theme } = this.props;
		return (
			<TextInput
				containerStyle={[styles.content, styles.inputContainer]}
				inputStyle={[
					styles.input,
					styles.textInput,
					{
						borderColor: themes[theme].separatorColor,
						backgroundColor: themes[theme].focusedBackground
					}
				]}
				placeholder=''
				onChangeText={handleText => this.setState({ value: handleText })}
				defaultValue={value}
				multiline
				textAlignVertical='top'
				autoFocus
				theme={theme}
			/>
		);
	}

	renderError = () => {
		const { room } = this.state;
		const { theme } = this.props;
		return (
			<View style={[styles.container, styles.centered, { backgroundColor: themes[theme].backgroundColor }]}>
				<Text style={styles.title}>
					{
						isBlocked(room) ? I18n.t('This_room_is_blocked') : I18n.t('This_room_is_read_only')
					}
				</Text>
			</View>
		);
	}

	render() {
		const { theme } = this.props;
		const {
			name, loading, isMedia, room, readOnly
		} = this.state;

		if (readOnly || isBlocked(room)) {
			return this.renderError();
		}

		return (
			<View style={[styles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}>
				<View
					style={[
						isMedia
							? styles.toContent
							: styles.toContentText,
						{
							backgroundColor: isMedia
								? themes[theme].focusedBackground
								: themes[theme].auxiliaryBackground
						}
					]}
				>
					<Text style={styles.text} numberOfLines={1}>
						<Text style={[styles.to, { color: themes[theme].auxiliaryText }]}>{`${ I18n.t('To') }: `}</Text>
						<Text style={[styles.name, { color: themes[theme].titleText }]}>{`${ name }`}</Text>
					</Text>
				</View>
				<View style={[styles.content, { backgroundColor: themes[theme].auxiliaryBackground }]}>
					{isMedia ? this.renderMediaContent() : this.renderInput()}
				</View>
				{ loading ? <ActivityIndicator size='large' theme={theme} absolute /> : null }
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
	server: share.server
}));

export default connect(mapStateToProps)(withTheme(ShareView));
