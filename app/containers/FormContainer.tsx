import React from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, View } from 'react-native';

import sharedStyles from '../views/Styles';
import scrollPersistTaps from '../lib/methods/helpers/scrollPersistTaps';
import KeyboardView from './KeyboardView';
import { useTheme } from '../theme';
import AppVersion from './AppVersion';
import { isTablet } from '../lib/methods/helpers';
import SafeAreaView from './SafeAreaView';

interface IFormContainer extends ScrollViewProps {
	testID: string;
	children: React.ReactElement | React.ReactElement[] | null;
	showAppVersion?: boolean;
}

const styles = StyleSheet.create({
	scrollView: {
		minHeight: '100%'
	}
});

export const FormContainerInner = ({
	children,
	accessibilityLabel
}: {
	children: (React.ReactElement | null)[];
	accessibilityLabel?: string;
}) => (
	<View accessibilityLabel={accessibilityLabel} style={[sharedStyles.container, isTablet && sharedStyles.tabletScreenContent]}>
		{children}
	</View>
);

const FormContainer = ({ children, testID, showAppVersion = true, ...props }: IFormContainer) => {
	const { colors } = useTheme();

	return (
		<KeyboardView>
			<ScrollView
				style={sharedStyles.container}
				contentContainerStyle={[sharedStyles.containerScrollView, styles.scrollView]}
				{...scrollPersistTaps}
				{...props}>
				<SafeAreaView testID={testID} style={{ backgroundColor: colors.surfaceRoom }}>
					{children}
					<>{showAppVersion && <AppVersion />}</>
				</SafeAreaView>
			</ScrollView>
		</KeyboardView>
	);
};

export default FormContainer;
