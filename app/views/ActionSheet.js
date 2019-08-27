import React from 'react';
import {
	View, Text, StyleSheet, Keyboard
} from 'react-native';
import Animated from 'react-native-reanimated';
import Touchable from 'react-native-platform-touchable';
import { RectButton } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-navigation';
import Modalize from 'react-native-modalize';

import sharedStyles from './Styles';
import { CustomIcon } from '../lib/Icons';
import EventEmitter from '../utils/events';
import { COLOR_SEPARATOR, COLOR_DANGER, COLOR_BACKGROUND_CONTAINER } from '../constants/colors';
import { isIOS } from '../utils/deviceInfo';

export const LISTENER = 'ActionSheet';

const PANEL_MARGIN_VERTICAL = 10;
const ROW_HEIGHT = 50;

const styles = StyleSheet.create({
	panel: {
		marginVertical: PANEL_MARGIN_VERTICAL,
		paddingHorizontal: 8
	},
	panelButton: {
		height: ROW_HEIGHT,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: COLOR_SEPARATOR,
		flexDirection: 'row',
		alignItems: 'center'
	},
	panelButtonIcon: {
		paddingHorizontal: 16
	},
	androidButtonView: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: COLOR_SEPARATOR
	},
	buttonText: {
		...sharedStyles.textRegular,
		...sharedStyles.textColorNormal,
		fontSize: 16
	},
	danger: {
		color: COLOR_DANGER
	},
	handle: {
		marginBottom: 10
	},
	cancelButton: {
		flex: 1,
		margin: 20,
		padding: 12,
		textAlign: 'center',
		alignItems: 'center',
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	}
});

export default class ActionSheet extends React.Component {
	constructor(props) {
		super(props);
		this.value_fall = new Animated.Value(1);
		this.state = {
			options: [],
			showCancelFooter: false,
			headerComponent: null
		};
		this.modalRef = React.createRef();
	}

	componentDidMount() {
		EventEmitter.addEventListener(LISTENER, this.handleDisplay);
	}

	componentWillUnmount() {
		EventEmitter.removeListener(LISTENER);
	}

	handleDisplay = ({ options, headerComponent, showCancelFooter }) => {
		Keyboard.dismiss();
		this.setState({ options, headerComponent, showCancelFooter });
		this.modalRef.current.open();
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	}

	hideActionSheet = () => {
		this.modalRef.current.close();
	}

	buttonIcon = (icon, isDanger) => {
		if (!icon) {
			return null;
		}
		let dangerStyle = {};
		if (isDanger) {
			dangerStyle = styles.danger;
		}
		return (
			<CustomIcon name={icon} size={18} style={[styles.panelButtonIcon, dangerStyle]} />
		);
	}

	buttonText = (label, isDanger) => {
		let dangerStyle = {};
		if (isDanger) {
			dangerStyle = styles.danger;
		}
		return (
			<Text style={[styles.buttonText, dangerStyle]}>{label}</Text>
		);
	}

	onOptionPress = (action) => {
		action();
		this.hideActionSheet();
	}

	renderFooter = () => {
		const { showCancelFooter } = this.state;
		if (!showCancelFooter) {
			return null;
		}

		if (isIOS) {
			return (
				<Touchable onPress={this.hideActionSheet}>
					<Text style={styles.cancelButton}>
						Cancel
					</Text>
				</Touchable>
			);
		}
		return (
			<RectButton onPress={this.hideActionSheet} style={styles.cancelButton}>
				<Text>Cancel</Text>
			</RectButton>
		);
	}

	renderInner = () => {
		const { options, headerComponent } = this.state;
		return (
			<SafeAreaView style={styles.panel} forceInset={{ vertical: 'never' }}>
				{headerComponent ? headerComponent(this.hideActionSheet) : null}
				{options.map(option => (
					isIOS
						? (
							<Touchable onPress={() => this.onOptionPress(option.handler)} key={option.label}>
								<View style={styles.panelButton}>
									{this.buttonIcon(option.icon, option.isDanger)}
									{this.buttonText(option.label, option.isDanger)}
								</View>
							</Touchable>
						) : (
							<View style={styles.androidButtonView}>
								<RectButton onPress={() => this.onOptionPress(option.handler)} key={option.label} style={styles.panelButton}>
									{this.buttonIcon(option.icon, option.isDanger)}
									{this.buttonText(option.label, option.isDanger)}
								</RectButton>
							</View>
						)
				))}
				{this.renderFooter()}
			</SafeAreaView>
		);
	}

	render() {
		return (
			<Modalize
				ref={this.modalRef}
				adjustToContentHeight
				handlePosition='inside'
				handleStyle={styles.handle}
			>
				{this.renderInner()}
			</Modalize>

		);
	}
}
