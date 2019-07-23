import React from 'react';
import {
	View, Text, StyleSheet, Keyboard, TouchableWithoutFeedback
} from 'react-native';
import BottomSheet from 'reanimated-bottom-sheet';
import Animated from 'react-native-reanimated';
import Touchable from 'react-native-platform-touchable';
import { RectButton } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-navigation';

import sharedStyles from './Styles';
import { CustomIcon } from '../lib/Icons';
import EventEmitter from '../utils/events';
import {
	COLOR_BACKGROUND_CONTAINER, COLOR_SEPARATOR, COLOR_DANGER, COLOR_BACKGROUND_NOTIFICATION
} from '../constants/colors';
import { isIOS } from '../utils/deviceInfo';
import I18n from '../i18n';

export const LISTENER = 'ActionSheet';
export const SNAP_POINTS = {
	HIDE: 0,
	FULL: 1
};

const { cond, call, eq } = Animated;

const HEADER_HEIGHT = 24;
const PANEL_PADDING_VERTICAL = 4;
const ROW_HEIGHT = 40;

const styles = StyleSheet.create({
	panel: {
		paddingVertical: PANEL_PADDING_VERTICAL,
		paddingBottom: 300,
		paddingHorizontal: 8,
		backgroundColor: COLOR_BACKGROUND_NOTIFICATION
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
		backgroundColor: COLOR_BACKGROUND_NOTIFICATION,
		paddingTop: 5,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		alignItems: 'center'
	},
	headerText: {
		...sharedStyles.textMedium,
		...sharedStyles.textColorTitle,
		fontSize: 20,
		paddingVertical: 4
	},
	panelHandle: {
		width: 40,
		height: 8,
		marginTop: 10,
		borderRadius: 4,
		backgroundColor: COLOR_SEPARATOR
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
	androidCancelButtonView: {
		height: ROW_HEIGHT,
		alignItems: 'center'
	},
	cancelButton: {
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		paddingVertical: 5,
		paddingHorizontal: 60,
		marginTop: 5,
		borderRadius: 20
	},
	backdrop: {
		...StyleSheet.absoluteFill,
		backgroundColor: '#000000',
		opacity: 0.5
	}
});

export default class ActionSheet extends React.Component {
	constructor(props) {
		super(props);
		this.value_fall = new Animated.Value(1);
		this.state = {
			options: [],
			snapPoints: [0, 100],
			header: '',
			isBottomSheetVisible: false
		};
		this.bottomSheetRef = React.createRef();
	}

	componentDidMount() {
		EventEmitter.addEventListener(LISTENER, this.handleDisplay);
	}

	componentWillUnmount() {
		EventEmitter.removeListener(LISTENER);
	}

	handleDisplay = ({ options, snapPoint, header }) => {
		Keyboard.dismiss();
		const height = options.length * ROW_HEIGHT + HEADER_HEIGHT + (2 * PANEL_PADDING_VERTICAL) + 20 + ROW_HEIGHT;
		const snapPoints = [0, height];
		this.setState({
			options, snapPoints, header, isBottomSheetVisible: true
		});
		this.bottomSheetRef.current.snapTo(snapPoint);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	}

	hideActionSheet = () => {
		this.bottomSheetRef.current.snapTo(0);
	}

	hideBackdropSheet = () => {
		this.setState({ isBottomSheetVisible: false });
	}

	renderHeader = () => {
		const { header } = this.state;
		return (
			<View style={styles.header}>
				{ header ? <Text style={styles.headerText}>{header}</Text> : <View style={styles.panelHandle} />}
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
				{isIOS
					? (
						<Touchable onPress={this.hideActionSheet} style={styles.cancelButton} key='cancel'>
							<Text style={styles.cancelButtonText}>{I18n.t('Cancel')}</Text>
						</Touchable>
					) : (
						<View style={styles.androidCancelButtonView}>
							<RectButton onPress={this.hideActionSheet} style={styles.cancelButton} key='cancel'>
								<Text style={styles.buttonText}>{I18n.t('Cancel')}</Text>
							</RectButton>
						</View>
					)}
			</SafeAreaView>
		);
	}

	render() {
		const { snapPoints, isBottomSheetVisible } = this.state;
		return (
			<React.Fragment>
				{isBottomSheetVisible ? (
					<TouchableWithoutFeedback onPress={this.hideActionSheet}>
						<View style={styles.backdrop} />
					</TouchableWithoutFeedback>
				) : null
				}
				<BottomSheet
					ref={this.bottomSheetRef}
					initialSnap={0}
					snapPoints={snapPoints}
					renderHeader={this.renderHeader}
					renderContent={this.renderInner}
					enabledManualSnapping={false}
					enabledInnerScrolling={false}
					overdragResistanceFactor={5}
					callbackNode={this.value_fall}
				/>
				<Animated.Code
					exec={
						// this.value_fall === 1 is closed
						cond(eq(this.value_fall, 1), call([this.value_fall], this.hideBackdropSheet))
					}
				/>
			</React.Fragment>
		);
	}
}
