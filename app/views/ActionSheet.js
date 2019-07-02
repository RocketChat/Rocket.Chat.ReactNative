import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet from 'reanimated-bottom-sheet';
import Touchable from 'react-native-platform-touchable';

import { verticalScale } from '../utils/scaling';
import sharedStyles from './Styles';
import { CustomIcon } from '../lib/Icons';
import EventEmitter from '../utils/events';
import vibrate from '../utils/throttle';
import { COLOR_BACKGROUND_CONTAINER, COLOR_SEPARATOR } from '../constants/colors';

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
const buttonPaddingsSize = verticalScale(35);
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
		borderBottomWidth: 1,
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
		borderTopRightRadius: 20
	},
	panelHeader: {
		alignItems: 'center'
	},
	panelHandle: {
		width: 40,
		height: 8,
		borderRadius: 4,
		backgroundColor: COLOR_SEPARATOR
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
					<Touchable onPress={() => { this.hideActionSheet(); option.handler(); }} key={option.label}>
						<View style={styles.panelButton}>
							{this.buttonIcon(option.icon)}
							{this.buttonText(option.label)}
						</View>
					</Touchable>
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
