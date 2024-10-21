import React from 'react';
import { StyleSheet, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
import { NavigationContainerProps } from '@react-navigation/core';
import { useKeyboard } from '@react-native-community/hooks';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import sharedStyles from '../../views/Styles';
import { themes } from '../../lib/constants';
import { TSupportedThemes } from '../../theme';
import { isAndroid } from '../../lib/methods/helpers';

const MODAL_MARGIN = 32;

interface IModalContainer extends NavigationContainerProps {
	navigation: NativeStackNavigationProp<any>;
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
	const { keyboardHeight, keyboardShown } = useKeyboard();
	const { height } = useWindowDimensions();
	const modalHeight = sharedStyles.modalFormSheet.height;

	let heightModal: number;

	if (isAndroid && keyboardShown && keyboardHeight + modalHeight > height) {
		heightModal = height - keyboardHeight - MODAL_MARGIN;
	} else if (modalHeight > height) {
		heightModal = height - MODAL_MARGIN;
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
