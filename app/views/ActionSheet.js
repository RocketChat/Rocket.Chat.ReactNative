import React from 'react';
import {
	View, Text, StyleSheet, Keyboard
} from 'react-native';
import BottomSheet from 'reanimated-bottom-sheet';
import Touchable from 'react-native-platform-touchable';
import { RectButton } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-navigation';

import sharedStyles from './Styles';
import { CustomIcon } from '../lib/Icons';
import EventEmitter from '../utils/events';
import { COLOR_BACKGROUND_CONTAINER, COLOR_SEPARATOR, COLOR_DANGER } from '../constants/colors';
import { isIOS } from '../utils/deviceInfo';

export const LISTENER = 'actionSheet';
export const SNAP_POINTS = {
	HIDE: 0,
	FULL: 1
};

const bottomSheetHeaderHeight = 24;
const panelPaddingVertical = 8;
const ROW_HEIGHT = 40;

const styles = StyleSheet.create({
	panel: {
		paddingVertical: panelPaddingVertical,
		paddingBottom: 300,
		paddingHorizontal: 8,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
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
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		paddingTop: 16,
		// borderTopLeftRadius: 20,
		// borderTopRightRadius: 20,
		alignItems: 'center'
	},
	panelHandle: {
		width: 40,
		height: 8,
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
	}
});

export default class ActionSheet extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			options: [],
			snapPoints: [0, 100]
		};
		this.bottomSheetRef = React.createRef();
	}

	componentDidMount() {
		EventEmitter.addEventListener(LISTENER, this.handleDisplay);
	}

	componentWillUnmount() {
		EventEmitter.removeListener(LISTENER);
	}

	handleDisplay = ({ options, snapPoint }) => {
		Keyboard.dismiss();
		const height = options.length * ROW_HEIGHT + bottomSheetHeaderHeight + (2 * panelPaddingVertical) + 20;
		const snapPoints = [0, height];
		this.setState({ options, snapPoints });
		this.bottomSheetRef.current.snapTo(snapPoint);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	}

	hideActionSheet = () => {
		this.bottomSheetRef.current.snapTo(0);
	}


	renderHeader = () => (
		<View style={styles.header}>
			<View style={styles.panelHandle} />
		</View>
	);

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
		const { snapPoints } = this.state;
		return (
			<BottomSheet
				ref={this.bottomSheetRef}
				initialSnap={0}
				snapPoints={snapPoints}
				renderHeader={this.renderHeader}
				renderContent={this.renderInner}
				enabledManualSnapping={false}
				enabledInnerScrolling={false}
				overdragResistanceFactor={5}
			/>
		);
	}
}
