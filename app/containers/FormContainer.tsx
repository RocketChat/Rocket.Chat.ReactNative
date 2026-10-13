import { type ReactElement } from 'react';
import { type ScrollViewProps, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import sharedStyles from '../views/Styles';
import scrollPersistTaps from '../lib/methods/helpers/scrollPersistTaps';
import { useTheme } from '../theme';
import AppVersion from './AppVersion';
import { isTablet } from '../lib/methods/helpers';
import SafeAreaView from './SafeAreaView';

interface IFormContainer extends ScrollViewProps {
	testID: string;
	children: ReactElement | ReactElement[] | null;
	showAppVersion?: boolean;
}

const styles = StyleSheet.create({
	scrollView: {
		flexGrow: 1
	}
});

export const FormContainerInner = ({
	children,
	accessibilityLabel
}: {
	children: (ReactElement | null)[];
	accessibilityLabel?: string;
}): ReactElement => (
	<View accessibilityLabel={accessibilityLabel} style={[sharedStyles.container, isTablet && sharedStyles.tabletScreenContent]}>
		{children}
	</View>
);

const FormContainer = ({ children, testID, showAppVersion = true, ...props }: IFormContainer): ReactElement => {
	const { colors } = useTheme();
	const { bottom } = useSafeAreaInsets();

	return (
		<KeyboardAwareScrollView
			style={[sharedStyles.container, { backgroundColor: colors.surfaceRoom }]}
			contentContainerStyle={[sharedStyles.containerScrollView, styles.scrollView, { paddingBottom: Math.max(24, bottom) }]}
			bottomOffset={20}
			{...scrollPersistTaps}
			{...props}>
			<SafeAreaView testID={testID} style={{ backgroundColor: colors.surfaceRoom }}>
				{children}
				<>{showAppVersion && <AppVersion />}</>
			</SafeAreaView>
		</KeyboardAwareScrollView>
	);
};

export default FormContainer;
