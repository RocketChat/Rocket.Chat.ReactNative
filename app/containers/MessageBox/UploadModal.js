import React, { Component } from 'react';
import {
	View, Text, StyleSheet, Image, ScrollView, TouchableHighlight
} from 'react-native';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import { responsive } from 'react-native-responsive-ui';
import equal from 'deep-equal';

import TextInput from '../TextInput';
import Button from '../Button';
import I18n from '../../i18n';
import sharedStyles from '../../views/Styles';
import { isIOS } from '../../utils/deviceInfo';
import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import { withTheme } from '../../theme';
import { withSplit } from '../../split';

const styles = StyleSheet.create({
	modal: {
		width: '100%',
		alignItems: 'center',
		margin: 0
	},
	titleContainer: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingTop: 16
	},
	title: {
		fontSize: 14,
		...sharedStyles.textBold
	},
	container: {
		height: 430,
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
	bigPreview: {
		height: 250
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: 16
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
		margin: 20,
		flex: 1,
		textAlign: 'center'
	},
	video: {
		flex: 1,
		borderRadius: 4,
		height: 150,
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
		theme: PropTypes.string,
		split: PropTypes.bool
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
		const {
			window, isVisible, split, theme
		} = this.props;

		if (nextState.name !== name) {
			return true;
		}
		if (nextProps.split !== split) {
			return true;
		}
		if (nextProps.theme !== theme) {
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

	submit = () => {
		const { file, submit } = this.props;
		const { name, description } = this.state;
		submit({ ...file, name, description });
	}

	renderButtons = () => {
		const { close, theme } = this.props;
		if (isIOS) {
			return (
				<View style={[styles.buttonContainer, { backgroundColor: themes[theme].auxiliaryBackground }]}>
					<Button
						title={I18n.t('Cancel')}
						type='secondary'
						backgroundColor={themes[theme].chatComponentBackground}
						style={styles.button}
						onPress={close}
						theme={theme}
					/>
					<Button
						title={I18n.t('Send')}
						type='primary'
						style={styles.button}
						onPress={this.submit}
						theme={theme}
					/>
				</View>
			);
		}
		// FIXME: RNGH don't work well on Android modals: https://github.com/kmagiera/react-native-gesture-handler/issues/139
		return (
			<View style={[styles.buttonContainer, { backgroundColor: themes[theme].auxiliaryBackground }]}>
				<TouchableHighlight
					onPress={close}
					style={[styles.androidButton, { backgroundColor: themes[theme].chatComponentBackground }]}
					underlayColor={themes[theme].chatComponentBackground}
					activeOpacity={0.5}
				>
					<Text style={[styles.androidButtonText, { ...sharedStyles.textBold, color: themes[theme].tintColor }]}>{I18n.t('Cancel')}</Text>
				</TouchableHighlight>
				<TouchableHighlight
					onPress={this.submit}
					style={[styles.androidButton, { backgroundColor: themes[theme].tintColor }]}
					underlayColor={themes[theme].tintColor}
					activeOpacity={0.5}
				>
					<Text style={[styles.androidButtonText, { ...sharedStyles.textMedium, color: themes[theme].buttonText }]}>{I18n.t('Send')}</Text>
				</TouchableHighlight>
			</View>
		);
	}

	renderPreview() {
		const { file, split, theme } = this.props;
		if (file.mime && file.mime.match(/image/)) {
			return (<Image source={{ isStatic: true, uri: file.path }} style={[styles.image, split && styles.bigPreview]} />);
		}
		if (file.mime && file.mime.match(/video/)) {
			return (
				<View style={[styles.video, { backgroundColor: themes[theme].bannerBackground }]}>
					<CustomIcon name='play' size={72} color={themes[theme].buttonText} />
				</View>
			);
		}
		return (<CustomIcon name='file-generic' size={72} style={[styles.fileIcon, { color: themes[theme].tintColor }]} />);
	}

	render() {
		const {
			window: { width }, isVisible, close, split, theme
		} = this.props;
		const { name, description } = this.state;
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
				<View style={[styles.container, { width: width - 32, backgroundColor: themes[theme].chatComponentBackground }, split && [sharedStyles.modal, sharedStyles.modalFormSheet]]}>
					<View style={styles.titleContainer}>
						<Text style={[styles.title, { color: themes[theme].titleText }]}>{I18n.t('Upload_file_question_mark')}</Text>
					</View>

					<ScrollView style={styles.scrollView}>
						{this.renderPreview()}
						<TextInput
							placeholder={I18n.t('File_name')}
							value={name}
							onChangeText={value => this.setState({ name: value })}
							theme={theme}
						/>
						<TextInput
							placeholder={I18n.t('File_description')}
							value={description}
							onChangeText={value => this.setState({ description: value })}
							theme={theme}
						/>
					</ScrollView>
					{this.renderButtons()}
				</View>
			</Modal>
		);
	}
}

export default responsive(withTheme(withSplit(UploadModal)));
