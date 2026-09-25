import { PlainText as NativePlainText, type PlainTextProps } from 'react-native-plain-text';

export const PlainText = ({
	children,
	style,
	numberOfLines,
	ellipsizeMode,
	testID,
	accessible = true,
	accessibilityRole = 'text',
	accessibilityLabel = children
}: PlainTextProps) => (
	<NativePlainText
		style={style}
		numberOfLines={numberOfLines}
		ellipsizeMode={ellipsizeMode}
		testID={testID}
		accessible={accessible}
		accessibilityRole={accessibilityRole}
		accessibilityLabel={accessibilityLabel}>
		{children}
	</NativePlainText>
);
