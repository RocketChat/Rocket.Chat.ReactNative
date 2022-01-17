import React from 'react';
import { StyleSheet, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { NavigationContainerProps } from '@react-navigation/core';

import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';

interface IModalContainer extends NavigationContainerProps {
	navigation: StackNavigationProp<any>;
	children: React.ReactNode;
	theme: string;
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
	const { height } = useWindowDimensions();
	const modalHeight = sharedStyles.modalFormSheet.height;
	return (
		<View style={[styles.root, { backgroundColor: `${themes[theme].backdropColor}70` }]}>
			<TouchableWithoutFeedback onPress={() => navigation.pop()}>
				<View style={styles.backdrop} />
			</TouchableWithoutFeedback>
			<View
				style={{
					...sharedStyles.modalFormSheet,
					height: modalHeight > height ? height : modalHeight
				}}>
				{children}
			</View>
		</View>
	);
};
