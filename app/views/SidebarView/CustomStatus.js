import React, { Component } from 'react';
import {
	View, Text, StyleSheet, ScrollView, TouchableHighlight
} from 'react-native';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import { responsive } from 'react-native-responsive-ui';

import { LISTENER } from '../../containers/Toast';
import EventEmitter from '../../utils/events';
import TextInput from '../../containers/TextInput';
import Button from '../../containers/Button';
import I18n from '../../i18n';
import sharedStyles from '../Styles';
import { isIOS } from '../../utils/deviceInfo';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { withSplit } from '../../split';
import SidebarItem from './SidebarItem';
import { CustomIcon } from '../../lib/Icons';
import RocketChat from '../../lib/rocketchat';

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
		height: 230,
		flexDirection: 'column'
	},
	scrollView: {
		flex: 1,
		padding: 16
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
	}

});

class CustomStatus extends Component {
	static propTypes = {
		user: PropTypes.object,
		window: PropTypes.object,
		theme: PropTypes.string,
		statusText: PropTypes.string,
		split: PropTypes.bool
	}

	state = {
		statusText: null,
		showModal: false,
		saving: false
	};

	shouldComponentUpdate(nextProps, nextState) {
		const { statusText, showModal } = this.state;
		const {
			window, user, split, theme
		} = this.props;

		if (nextState.statusText !== statusText) {
			return true;
		}
		if (nextProps.split !== split) {
			return true;
		}
		if (nextProps.user.statusText !== user.statusText) {
			return true;
		}
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextProps.window.width !== window.width) {
			return true;
		}
		if (nextState.showModal !== showModal) {
			return true;
		}
		return false;
	}

	toggleModal = () => this.setState(prevState => ({ showModal: !prevState.showModal }));

	submit = async() => {
		const { statusText } = this.state;

		this.setState({ saving: true });
		try {
			const result = await RocketChat.saveUserProfile({ statusText }, {});
			if (result.success) {
				EventEmitter.emit(LISTENER, { message: I18n.t('Status_saved_successfully') });
			} else {
				EventEmitter.emit(LISTENER, { message: I18n.t('error-could-not-change-status') });
			}
		} catch {
			// do nothing
		}

		this.toggleModal();
		this.setState({ saving: false });
	}

	renderButtons = () => {
		const { theme } = this.props;
		const { saving } = this.state;
		if (isIOS) {
			return (
				<View style={[styles.buttonContainer, { backgroundColor: themes[theme].auxiliaryBackground }]}>
					<Button
						title={I18n.t('Cancel')}
						type='secondary'
						backgroundColor={themes[theme].chatComponentBackground}
						style={styles.button}
						onPress={this.toggleModal}
						theme={theme}
					/>
					<Button
						title={I18n.t('Set_status')}
						type='primary'
						style={styles.button}
						onPress={this.submit}
						theme={theme}
						loading={saving}
					/>
				</View>
			);
		}
		return (
			<View style={[styles.buttonContainer, { backgroundColor: themes[theme].auxiliaryBackground }]}>
				<TouchableHighlight
					onPress={this.toggleModal}
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
					<Text style={[styles.androidButtonText, { ...sharedStyles.textMedium, color: themes[theme].buttonText }]}>{I18n.t('Set_status')}</Text>
				</TouchableHighlight>
			</View>
		);
	}

	render() {
		const {
			window: { width }, user, split, theme
		} = this.props;
		const { showModal, statusText } = this.state;
		return (
			<>
				<SidebarItem
					text={user.statusText || I18n.t('Edit_Status')}
					left={<CustomIcon name='edit' size={20} color={themes[theme].titleText} />}
					onPress={this.toggleModal}
					testID='sidebar-custom-status'
				/>
				<Modal
					isVisible={showModal}
					style={styles.modal}
					onBackdropPress={this.toggleModal}
					onBackButtonPress={this.toggleModal}
					animationIn='fadeIn'
					animationOut='fadeOut'
					useNativeDriver
					hideModalContentWhileAnimating
					avoidKeyboard
				>
					<View style={[styles.container, { width: width - 32, backgroundColor: themes[theme].chatComponentBackground }, split && [sharedStyles.modal, sharedStyles.modalFormSheet]]}>
						<View style={styles.titleContainer}>
							<Text style={[styles.title, { color: themes[theme].titleText }]}>{I18n.t('Set_custom_status')}</Text>
						</View>
						<ScrollView style={styles.scrollView}>
							<TextInput
								placeholder={I18n.t('Set_custom_status')}
								onChangeText={value => this.setState({ statusText: value })}
								value={statusText || user.statusText}
								theme={theme}
							/>
						</ScrollView>
						{this.renderButtons()}
					</View>
				</Modal>
			</>
		);
	}
}

export default responsive(withTheme(withSplit(CustomStatus)));
