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
import { COLOR_SEPARATOR, COLOR_DANGER } from '../constants/colors';
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
	header: {
		paddingTop: 15,
		paddingBottom: 5,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		alignItems: 'center',
		...sharedStyles.separatorBottom
	},
	headerText: {
		...sharedStyles.textRegular,
		...sharedStyles.textColorTitle,
		fontSize: 20,
		paddingVertical: 4
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
	}
});

export default class ActionSheet extends React.Component {
	constructor(props) {
		super(props);
		this.value_fall = new Animated.Value(1);
		this.state = {
			options: []
		};
		this.modalRef = React.createRef();
	}

	componentDidMount() {
		EventEmitter.addEventListener(LISTENER, this.handleDisplay);
	}

	componentWillUnmount() {
		EventEmitter.removeListener(LISTENER);
	}

	handleDisplay = ({ options, header }) => {
		Keyboard.dismiss();
		this.setState({ options, header });
		this.modalRef.current.open();
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	}

	hideActionSheet = () => {
		this.modalRef.current.close();
	}

	renderHeader = () => {
		const { header } = this.state;
		if (!header) {
			return null;
		}
		return (
			<View style={styles.header}>
				<Text style={styles.headerText}>{header}</Text>
			</View>
		);
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

	renderInner = () => {
		const { options } = this.state;
		return (
			<SafeAreaView style={styles.panel}>
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
