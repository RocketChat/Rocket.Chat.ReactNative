import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet from 'reanimated-bottom-sheet';
import Touchable from 'react-native-platform-touchable';
import { RectButton } from 'react-native-gesture-handler';

import { verticalScale } from '../utils/scaling';
import sharedStyles from './Styles';
import { CustomIcon } from '../lib/Icons';
import { isIOS } from '../utils/deviceInfo';
import EventEmitter from '../utils/events';
import vibrate from '../utils/throttle';

/*
To use this emmit an event to LISTNER and pass an object with snapPoint and options as parameter

example object = {
	snapPoint: SNAP_POINT.HALF,
	options: {}
}

option object that you pass should have
1. lable
2. hadler
3. icon // if not provided gives an flag icon

example optionObject : {
	label: 'Permalink',
	handler: this.dummy,
	icon: 'permalink'
}

*/

export const LISTNER = 'actionSheet';
export const SNAP_PONITS = {
	HIDE: 0,
	SHORT: 1,
	HALF: 2,
	FULL: 3
};

const bottomSheetHeaderHeight = 25;
const buttonPaddingsSize = verticalScale(25);
const textSize = 13;

const styles = StyleSheet.create({
	panel: {
		height: verticalScale(500),
		padding: verticalScale(5),
		backgroundColor: '#f3f3f3'
	},
	panelButton: {
		padding: verticalScale(10),
		backgroundColor: 'transparent',
		borderBottomWidth: 1,
		borderBottomColor: '#dadada',
		flexDirection: 'row'
	},
	panelButtonIcon: {
		paddingHorizontal: 5
	},
	header: {
		backgroundColor: '#f3f3f3',
		paddingTop: 15,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20
	},
	panelHeader: {
		alignItems: 'center'
	},
	panelHandle: {
		width: 40,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#dadada'
	},
	androidButtonView: {
		borderBottomWidth: 1,
		borderBottomColor: '#dadada'
	}
});

export default class ActionSheet extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			options: [
				{ label: 'Permalink', handler: this.dummy, icon: 'permalink' },
				{ label: 'Copy', handler: this.dummy, icon: 'copy' },
				{ label: 'Share', handler: this.dummy, icon: 'share' }
			]
		};
		this.bottomSheetRef = React.createRef();
	}

	componentDidMount() {
		EventEmitter.addEventListener(LISTNER, this.handleDisplay);
	}

	componentWillUnmount() {
		EventEmitter.removeListener(LISTNER);
	}

	dummy = () => {}

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
			<View style={styles.panelHeader}>
				<View style={styles.panelHandle} />
			</View>
		</View>
	);

	buttonIcon = (icon) => {
		if (!icon) {
			icon = 'flag';
		}
		return (
			<CustomIcon name={icon} size={18} style={styles.panelButtonIcon} />
		);
	}

	buttonText = label => (
		<Text style={sharedStyles.textRegular}>{label}</Text>
	)

	renderInner = () => {
		const { options } = this.state;
		const height = options.length * buttonPaddingsSize + options.length * textSize + bottomSheetHeaderHeight;
		return (
			<View style={[styles.panel, { height }]}>
				{options.map(option => (
					isIOS
						? (
							<Touchable onPress={() => { this.hideActionSheet(); option.handler(); }} key={option.label}>
								<View style={styles.panelButton}>
									{this.buttonIcon(option.icon)}
									{this.buttonText(option.label)}
								</View>
							</Touchable>
						)
						: (
							<View style={styles.androidButtonView}>
								<RectButton onPress={() => { this.hideActionSheet(); option.handler(); }} key={option.label} style={styles.panelButton}>
									{this.buttonIcon(option.icon)}
									{this.buttonText(option.label)}
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
