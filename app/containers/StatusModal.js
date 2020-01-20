import React, { Component } from 'react';
import {
	View, Text, StyleSheet, ScrollView, TouchableHighlight
} from 'react-native';
import PropTypes from 'prop-types';
import Modal from 'react-native-modal';
import { responsive } from 'react-native-responsive-ui';

import TextInput from './TextInput';
import Button from './Button';
import I18n from '../i18n';
import sharedStyles from '../views/Styles';
import { isIOS } from '../utils/deviceInfo';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';
import { withSplit } from '../split';

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

class StatusModal extends Component {
	static propTypes = {
		isVisible: PropTypes.bool,
		close: PropTypes.func,
		submit: PropTypes.func,
		window: PropTypes.object,
		theme: PropTypes.string,
		statusText: PropTypes.string,
		split: PropTypes.bool
	}

	state = {
		statusText: '',
		saving: false
	};

	componentDidMount() {
		const { statusText } = this.props;
		this.setState({ statusText });
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { statusText } = this.state;
		const {
			window, isVisible, split, theme
		} = this.props;

		if (nextState.statusText !== statusText) {
			return true;
		}
		if (nextProps.split !== split) {
			return true;
		}
		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextProps.isVisible !== isVisible) {
			return true;
		}
		if (nextProps.window.width !== window.width) {
			return true;
		}
		return false;
	}

	submit = () => {
		this.setState({ saving: true });
		const { submit } = this.props;
		const { statusText } = this.state;
		submit(statusText);
	}

	renderButtons = () => {
		const { close, theme } = this.props;
		const { saving } = this.state;
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
					<Text style={[styles.androidButtonText, { ...sharedStyles.textMedium, color: themes[theme].buttonText }]}>{I18n.t('Set_status')}</Text>
				</TouchableHighlight>
			</View>
		);
	}

	render() {
		const {
			window: { width }, isVisible, close, split, theme
		} = this.props;
		const { statusText } = this.state;
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
				<View style={[styles.container, { width: width - 32, backgroundColor: themes[theme].chatComponentBackground }, split && sharedStyles.modal]}>
					<View style={styles.titleContainer}>
						<Text style={[styles.title, { color: themes[theme].titleText }]}>{I18n.t('Set_custom_status')}</Text>
					</View>

					<ScrollView style={styles.scrollView}>
						<TextInput
							placeholder={I18n.t('Set_custom_status')}
							value={statusText}
							onChangeText={value => this.setState({ statusText: value })}
							theme={theme}
						/>
					</ScrollView>
					{this.renderButtons()}
				</View>
			</Modal>
		);
	}
}

export default responsive(withTheme(withSplit(StatusModal)));
