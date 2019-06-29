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
	}

	componentDidMount() {
		EventEmitter.addEventListener('actionSheet', this.handleDisplay);
	}

	componentWillUnmount() {
		EventEmitter.removeListener('actionSheet');
	}

	dummy = () => {}

	handleDisplay = (args) => {
		this.setState({ options: args.options });
		this.bottomSheetRef.snapTo();
		vibrate();
	}


	renderHeader = () => (
		<View style={styles.header}>
			<View style={styles.panelHeader}>
				<View style={styles.panelHandle} />
			</View>
		</View>
	);

	buttonIcon = icon => (
		<CustomIcon name={icon} size={18} style={styles.panelButtonIcon} />
	)

	buttonText = label => (
		<Text style={sharedStyles.textRegular}>{label}</Text>
	)

	renderInner = () => {
		const { options } = this.state;
		return (
			<View style={[styles.panel, { height: this.bottomSheetHeight }]}>
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
				initialSnap={1}
				snapPoints={[0, 100, 400]}
				renderHeader={this.renderHeader}
				renderContent={this.renderInner}
				enabledManualSnapping
				enabledGestureInteraction
				enabledInnerScrolling
			/>
		);
	}
}
