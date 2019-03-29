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
import { COLOR_PRIMARY, COLOR_BACKGROUND_CONTAINER, COLOR_WHITE } from '../../constants/colors';

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
	}

});

@responsive
export default class UploadModal extends Component {
	static propTypes = {
		isVisible: PropTypes.bool,
		file: PropTypes.object,
		close: PropTypes.func,
		submit: PropTypes.func,
		window: PropTypes.object
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

	submit = () => {
		const { file, submit } = this.props;
		const { name, description } = this.state;
		submit({ ...file, name, description });
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

	render() {
		const { window: { width }, isVisible, close } = this.props;
		const { name, description, file } = this.state;
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
			>
				<View style={[styles.container, { width: width - 32 }]}>
					<View style={styles.titleContainer}>
						<Text style={styles.title}>{I18n.t('Upload_file_question_mark')}</Text>
					</View>

					<ScrollView style={styles.scrollView}>
						<Image source={{ isStatic: true, uri: file.path }} style={styles.image} />
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
			</Modal>
		);
	}
}
