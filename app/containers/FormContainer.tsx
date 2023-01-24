import React from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, View } from 'react-native';

import { themes } from '../lib/constants';
import sharedStyles from '../views/Styles';
import scrollPersistTaps from '../lib/methods/helpers/scrollPersistTaps';
import KeyboardView from './KeyboardView';
import { useTheme } from '../theme';
import StatusBar from './StatusBar';
import AppVersion from './AppVersion';
import { isTablet } from '../lib/methods/helpers';
import SafeAreaView from './SafeAreaView';

interface IFormContainer extends ScrollViewProps {
	testID: string;
	children: React.ReactElement | React.ReactElement[] | null;
}

const styles = StyleSheet.create({
	scrollView: {
		minHeight: '100%'
	}
});

export const FormContainerInner = ({ children }: { children: (React.ReactElement | null)[] }) => (
	<View style={[sharedStyles.container, isTablet && sharedStyles.tabletScreenContent]}>{children}</View>
);

const FormContainer = ({ children, testID, ...props }: IFormContainer) => {
	const { theme } = useTheme();

	return (
		<KeyboardView
			style={{ backgroundColor: themes[theme].backgroundColor }}
			contentContainerStyle={sharedStyles.container}
			keyboardVerticalOffset={128}
		>
			<StatusBar />
			<ScrollView
				style={sharedStyles.container}
				contentContainerStyle={[sharedStyles.containerScrollView, styles.scrollView]}
				{...scrollPersistTaps}
				{...props}
			>
				<SafeAreaView testID={testID} style={{ backgroundColor: themes[theme].backgroundColor }}>
					{children}
					<AppVersion theme={theme} />
				</SafeAreaView>
			</ScrollView>
		</KeyboardView>
	);
};

export default FormContainer;
