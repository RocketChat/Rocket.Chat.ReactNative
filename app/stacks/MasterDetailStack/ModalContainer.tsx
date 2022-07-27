import React from 'react';
import { StyleSheet, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { NavigationContainerProps } from '@react-navigation/core';

import sharedStyles from '../../views/Styles';
import { themes } from '../../lib/constants';
import { TSupportedThemes } from '../../theme';
import { isAndroid } from '../../lib/methods/helpers';
import { useKeyboardHeight } from '../../lib/hooks';
import { useOrientation } from '../../dimensions';

interface IModalContainer extends NavigationContainerProps {
	navigation: StackNavigationProp<any>;
	children: React.ReactNode;
	theme: TSupportedThemes;
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	},
	backdrop: {
		...StyleSheet.absoluteFillObject
	}
});

export const ModalContainer = ({ navigation, children, theme }: IModalContainer): JSX.Element => {
	const keyboardHeight = useKeyboardHeight();
	const { height } = useWindowDimensions();
	const { isLandscape } = useOrientation();
	const modalHeight = sharedStyles.modalFormSheet.height;

	let heightModal: number;

	if (modalHeight > height) {
		heightModal = height;
	} else if (isLandscape && isAndroid && keyboardHeight > 0) {
		heightModal = height - keyboardHeight - 32; // 32 is to force a padding
	} else {
		heightModal = modalHeight;
	}

	return (
		<View style={[styles.root, { backgroundColor: `${themes[theme].backdropColor}70` }]}>
			<TouchableWithoutFeedback onPress={() => navigation.pop()}>
				<View style={styles.backdrop} />
			</TouchableWithoutFeedback>
			<View
				style={{
					...sharedStyles.modalFormSheet,
					height: heightModal
				}}>
				{children}
			</View>
		</View>
	);
};
