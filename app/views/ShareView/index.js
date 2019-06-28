import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, TouchableOpacity, TextInput, Image
} from 'react-native';
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

export default class ShareView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: (
			<HeaderBackButton
				title={I18n.t('Back')}
				backTitleVisible
				onPress={navigation.goBack}
				tintColor={HEADER_BACK}
			/>
		),
		title: I18n.t('Share'),
		headerRight: (
			<TouchableOpacity onPress={navigation.getParam('sendMessage')} style={styles.sendButton}>
				<Text style={styles.send}>{I18n.t('Send')}</Text>
			</TouchableOpacity>
		)
	})

	static propTypes = {
		navigation: PropTypes.object
	};

	constructor(props) {
		super(props);
		const { navigation } = this.props;
		const rid = navigation.getParam('rid', '');
		const name = navigation.getParam('name', '');
		const value = navigation.getParam('value', '');
		const isMedia = navigation.getParam('isMedia', false);
		const fileInfo = navigation.getParam('fileInfo', {});
		this.state = {
			rid,
			value,
			isMedia,
			name,
			fileInfo,
			loading: false,
			file: {
				name: fileInfo.name,
				description: ''
			}
		};
	}

	componentWillMount() {
		const { navigation } = this.props;
		navigation.setParams({ sendMessage: this._sendMessage });
	}

	uriToPath = uri => uri.replace(/^file:\/\//, '').replace('%20', ' ');

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
				placeholderTextColor={COLOR_TEXT_DESCRIPTION}
			/>
		);
	}

	render() {
		const { name, loading, isMedia } = this.state;

		return (
			<View
				style={styles.container}
			>
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
