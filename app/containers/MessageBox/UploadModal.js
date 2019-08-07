import React, { Component } from 'react';
import {
	View, Text, StyleSheet, Image, ScrollView, TouchableHighlight
} from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import { responsive } from 'react-native-responsive-ui';
import equal from 'deep-equal';

import TextInput from '../TextInput';
import Button from '../Button';
import I18n from '../../i18n';
import sharedStyles from '../../views/Styles';
import { isIOS } from '../../utils/deviceInfo';
import { canUploadFile } from '../../utils/media';
import {
	COLOR_PRIMARY, COLOR_BACKGROUND_CONTAINER, COLOR_WHITE, COLOR_DANGER
} from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';

const cancelButtonColor = COLOR_BACKGROUND_CONTAINER;

const styles = StyleSheet.create({
	modal: {
		alignItems: 'center'
	},
	titleContainer: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingTop: 16
	},
	title: {
		fontSize: 14,
		...sharedStyles.textColorTitle,
		...sharedStyles.textBold
	},
	container: {
		height: 430,
		backgroundColor: COLOR_WHITE,
		flexDirection: 'column'
	},
	scrollView: {
		flex: 1,
		padding: 16
	},
	image: {
		height: 150,
		flex: 1,
		marginBottom: 16,
		resizeMode: 'contain'
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: 16,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	button: {
		marginBottom: 0
	},
	androidButton: {
		paddingHorizontal: 15,
		justifyContent: 'center',
		height: 48,
		borderRadius: 2
	},
	androidButtonText: {
		fontSize: 18,
		textAlign: 'center'
	},
	fileIcon: {
		color: COLOR_PRIMARY,
		margin: 20,
		flex: 1,
		textAlign: 'center'
	},
	errorIcon: {
		color: COLOR_DANGER
	},
	fileMime: {
		...sharedStyles.textColorTitle,
		...sharedStyles.textBold,
		textAlign: 'center',
		fontSize: 20,
		marginBottom: 20
	},
	errorContainer: {
		margin: 20,
		flex: 1,
		textAlign: 'center',
		justifyContent: 'center',
		alignItems: 'center'
	},
	video: {
		flex: 1,
		borderRadius: 4,
		height: 150,
		backgroundColor: '#1f2329',
		marginBottom: 6,
		alignItems: 'center',
		justifyContent: 'center'
	}

});

class UploadModal extends Component {
	static propTypes = {
		isVisible: PropTypes.bool,
		file: PropTypes.object,
		close: PropTypes.func,
		submit: PropTypes.func,
		window: PropTypes.object,
		FileUpload_MediaTypeWhiteList: PropTypes.string,
		FileUpload_MaxFileSize: PropTypes.number
	}

	state = {
		name: '',
		description: '',
		file: {}
	};

	static getDerivedStateFromProps(props, state) {
		if (!equal(props.file, state.file) && props.file && props.file.path) {
			return {
				file: props.file,
				name: props.file.filename || 'Filename',
				description: ''
			};
		}
		return null;
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { name, description, file } = this.state;
		const { window, isVisible } = this.props;

		if (nextState.name !== name) {
			return true;
		}
		if (nextState.description !== description) {
			return true;
		}
		if (nextProps.isVisible !== isVisible) {
			return true;
		}
		if (nextProps.window.width !== window.width) {
			return true;
		}
		if (!equal(nextState.file, file)) {
			return true;
		}
		return false;
	}

	canUploadFile = () => {
		const { FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize, file } = this.props;
		if (!(file && file.path)) {
			return true;
		}
		if (file.size > FileUpload_MaxFileSize) {
			return false;
		}
		// if white list is empty, all media types are enabled
		if (!FileUpload_MediaTypeWhiteList) {
			return true;
		}
		const allowedMime = FileUpload_MediaTypeWhiteList.split(',');
		if (allowedMime.includes(file.mime)) {
			return true;
		}
		const wildCardGlob = '/*';
		const wildCards = allowedMime.filter(item => item.indexOf(wildCardGlob) > 0);
		if (wildCards.includes(file.mime.replace(/(\/.*)$/, wildCardGlob))) {
			return true;
		}
		return false;
	}

	submit = () => {
		const { file, submit } = this.props;
		const { name, description } = this.state;
		submit({ ...file, name, description });
	}

	renderError = () => {
		const { file, FileUpload_MaxFileSize, close } = this.props;
		const { window: { width } } = this.props;
		const errorMessage = (FileUpload_MaxFileSize < file.size)
			? 'error-file-too-large'
			: 'error-invalid-file-type';
		return (
			<View style={[styles.container, { width: width - 32 }]}>
				<View style={styles.titleContainer}>
					<Text style={styles.title}>{I18n.t(errorMessage)}</Text>
				</View>
				<View style={styles.errorContainer}>
					<CustomIcon name='circle-cross' size={120} style={styles.errorIcon} />
				</View>
				<Text style={styles.fileMime}>{ file.mime }</Text>
				<View style={styles.buttonContainer}>
					{
						(isIOS)
							? (
								<Button
									title={I18n.t('Cancel')}
									type='secondary'
									backgroundColor={cancelButtonColor}
									style={styles.button}
									onPress={close}
								/>
							)
							: (
								<TouchableHighlight
									onPress={close}
									style={[styles.androidButton, { backgroundColor: cancelButtonColor }]}
									underlayColor={cancelButtonColor}
									activeOpacity={0.5}
								>
									<Text style={[styles.androidButtonText, { ...sharedStyles.textBold, color: COLOR_PRIMARY }]}>{I18n.t('Cancel')}</Text>
								</TouchableHighlight>
							)
					}
				</View>
			</View>
		);
	}

	renderButtons = () => {
		const { close } = this.props;
		if (isIOS) {
			return (
				<View style={styles.buttonContainer}>
					<Button
						title={I18n.t('Cancel')}
						type='secondary'
						backgroundColor={cancelButtonColor}
						style={styles.button}
						onPress={close}
					/>
					<Button
						title={I18n.t('Send')}
						type='primary'
						style={styles.button}
						onPress={this.submit}
					/>
				</View>
			);
		}
		// FIXME: RNGH don't work well on Android modals: https://github.com/kmagiera/react-native-gesture-handler/issues/139
		return (
			<View style={styles.buttonContainer}>
				<TouchableHighlight
					onPress={close}
					style={[styles.androidButton, { backgroundColor: cancelButtonColor }]}
					underlayColor={cancelButtonColor}
					activeOpacity={0.5}
				>
					<Text style={[styles.androidButtonText, { ...sharedStyles.textBold, color: COLOR_PRIMARY }]}>{I18n.t('Cancel')}</Text>
				</TouchableHighlight>
				<TouchableHighlight
					onPress={this.submit}
					style={[styles.androidButton, { backgroundColor: COLOR_PRIMARY }]}
					underlayColor={COLOR_PRIMARY}
					activeOpacity={0.5}
				>
					<Text style={[styles.androidButtonText, { ...sharedStyles.textMedium, color: COLOR_WHITE }]}>{I18n.t('Send')}</Text>
				</TouchableHighlight>
			</View>
		);
	}

	renderPreview() {
		const { file } = this.props;
		if (file.mime && file.mime.match(/image/)) {
			return (<Image source={{ isStatic: true, uri: file.path }} style={styles.image} />);
		}
		if (file.mime && file.mime.match(/video/)) {
			return (
				<View style={styles.video}>
					<CustomIcon name='play' size={72} color={COLOR_WHITE} />
				</View>
			);
		}
		return (<CustomIcon name='file-generic' size={72} style={styles.fileIcon} />);
	}

	render() {
		const {
			window: { width }, isVisible, close, file, FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize
		} = this.props;
		const { name, description } = this.state;
		const showError = !canUploadFile(file, { FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize });
		return (
			<Modal
				isVisible={isVisible}
				style={styles.modal}
				onBackdropPress={close}
				onBackButtonPress={close}
				animationIn='fadeIn'
				animationOut='fadeOut'
				useNativeDriver
				hideModalContentWhileAnimating
				avoidKeyboard
			>
				{(showError) ? this.renderError()
					: (
						<View style={[styles.container, { width: width - 32 }]}>
							<View style={styles.titleContainer}>
								<Text style={styles.title}>{I18n.t('Upload_file_question_mark')}</Text>
							</View>

							<ScrollView style={styles.scrollView}>
								{this.renderPreview()}
								<TextInput
									placeholder={I18n.t('File_name')}
									value={name}
									onChangeText={value => this.setState({ name: value })}
								/>
								<TextInput
									placeholder={I18n.t('File_description')}
									value={description}
									onChangeText={value => this.setState({ description: value })}
								/>
							</ScrollView>
							{this.renderButtons()}
						</View>
					)}
			</Modal>
		);
	}
}

const mapStateToProps = state => ({
	FileUpload_MediaTypeWhiteList: state.settings.FileUpload_MediaTypeWhiteList,
	FileUpload_MaxFileSize: state.settings.FileUpload_MaxFileSize
});

export default responsive(connect(mapStateToProps)(UploadModal));
