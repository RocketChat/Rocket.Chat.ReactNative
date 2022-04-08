export const withTest = (testID: string): { testID: string; accessibilityLabel: string } => ({
	testID,
	accessibilityLabel: testID
});
