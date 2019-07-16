import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet from 'reanimated-bottom-sheet';
import Touchable from 'react-native-platform-touchable';
import { RectButton } from 'react-native-gesture-handler';

import { verticalScale } from '../utils/scaling';
import sharedStyles from './Styles';
import { CustomIcon } from '../lib/Icons';
import EventEmitter from '../utils/events';
import vibrate from '../utils/throttle';
import { COLOR_BACKGROUND_CONTAINER, COLOR_SEPARATOR } from '../constants/colors';
import { isIOS } from '../utils/deviceInfo';


/*
To use this emit an event to LISTENER and pass an object with snapPoint and options as parameter

example object = {
	snapPoint: SNAP_POINT.HALF,
	options: {}
}

option object that you pass should have
1. label
2. handler
3. icon // if not provided gives an flag icon

example optionObject : {
	label: 'Permalink',
	handler: this.dummy,
	icon: 'permalink',
	isDange: true
}

*/

export const LISTENER = 'actionSheet';
export const SNAP_POINTS = {
	HIDE: 0,
	SHORT: 1,
	HALF: 2,
	FULL: 3
};

const bottomSheetHeaderHeight = 25;
const buttonPaddingSize = verticalScale(35);
const textSize = 13;

const styles = StyleSheet.create({
	panel: {
		paddingVertical: verticalScale(15),
		paddingHorizontal: verticalScale(10),
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	panelButton: {
		padding: verticalScale(15),
		backgroundColor: 'transparent',
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: COLOR_SEPARATOR,
		flexDirection: 'row'
	},
	panelButtonIcon: {
		paddingRight: 10
	},
	header: {
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		paddingTop: 15,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
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
		fontSize: 16
	},
	danger: {
		color: 'red'
	}
});

export default class ActionSheet extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			options: []
		};
		this.bottomSheetRef = React.createRef();
	}

	componentDidMount() {
		EventEmitter.addEventListener(LISTENER, this.handleDisplay);
	}

	componentWillUnmount() {
		EventEmitter.removeListener(LISTENER);
	}

	handleDisplay = (args) => {
		this.setState({ options: args.options });
		this.bottomSheetRef.current.snapTo(args.snapPoint);
		vibrate();
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
		const height = options.length * buttonPaddingSize + options.length * textSize + bottomSheetHeaderHeight;
		return (
			<View style={[styles.panel, { height }]}>
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
			</View>
		);
	}

	render() {
		return (
			<BottomSheet
				ref={this.bottomSheetRef}
				initialSnap={0}
				snapPoints={[0, 200, 300, 500]}
				renderHeader={this.renderHeader}
				renderContent={this.renderInner}
				enabledManualSnapping
				enabledGestureInteraction
				enabledInnerScrolling
			/>
		);
	}
}
