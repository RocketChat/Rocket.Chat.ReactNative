import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { ActionSheetProvider, useActionSheet } from '../Provider';
import Button from '../../Button';
import ActionSheetContentWithInputAndSubmit from './index';
import { ThemeContext, TSupportedThemes } from '../../../theme';
import { themes } from '../../../lib/constants/colors';
import SafeAreaView from '../../SafeAreaView';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16
	},
	button: {
		marginBottom: 12
	}
});

export default {
	title: 'ActionSheet/ActionSheetContentWithInputAndSubmit'
};

const StoryWrapper = ({ children }: { children: React.ReactElement }) => (
	<ActionSheetProvider>
		<SafeAreaView style={styles.container}>{children}</SafeAreaView>
	</ActionSheetProvider>
);

const TriggerButton = ({ title, onPress }: { title: string; onPress: () => void }) => (
	<View style={styles.button}>
		<Button title={title} onPress={onPress} />
	</View>
);

export const SingleTextInput = () => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();

		const handlePress = () => {
			showActionSheet({
				children: (
					<ActionSheetContentWithInputAndSubmit
						title='Enter your name'
						description='Please provide your full name'
						testID='single-text-input'
						secureTextEntry={false}
						placeholder='Full name'
						onSubmit={value => alert(`Submitted: ${value}`)}
					/>
				)
			});
		};

		return <TriggerButton title='Show Single Text Input' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};

export const SingleSecureInput = () => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();
		const { colors } = React.useContext(ThemeContext);

		const handlePress = () => {
			showActionSheet({
				children: (
					<ActionSheetContentWithInputAndSubmit
						title='Enter your password'
						description='For your security, please enter your current password to continue'
						testID='secure-input'
						secureTextEntry={true}
						placeholder='Password'
						confirmTitle='Confirm'
						confirmBackgroundColor={colors.buttonBackgroundDangerDefault}
						onSubmit={value => alert(`Password submitted: ${'*'.repeat(value.length)}`)}
					/>
				)
			});
		};

		return <TriggerButton title='Show Secure Input' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};

export const MultipleInputs = () => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();

		const handlePress = () => {
			showActionSheet({
				children: (
					<ActionSheetContentWithInputAndSubmit
						title='Change Password'
						description='Enter your current password and new password'
						testID='multiple-inputs'
						inputs={[
							{ placeholder: 'Current Password', secureTextEntry: true, key: 'current' },
							{ placeholder: 'New Password', secureTextEntry: true, key: 'new' },
							{ placeholder: 'Confirm New Password', secureTextEntry: true, key: 'confirm' }
						]}
						confirmTitle='Change Password'
						onSubmit={values => {
							if (Array.isArray(values)) {
								alert(`Current: ${values[0]}\nNew: ${values[1]}\nConfirm: ${values[2]}`);
							}
						}}
					/>
				)
			});
		};

		return <TriggerButton title='Show Multiple Inputs' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};

export const WithIconAndDescription = () => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();
		const { colors } = React.useContext(ThemeContext);

		const handlePress = () => {
			showActionSheet({
				children: (
					<ActionSheetContentWithInputAndSubmit
						title='Delete your account'
						description='For your security, you must enter your current password to continue'
						testID='delete-account'
						iconName='warning'
						iconColor={colors.buttonBackgroundDangerDefault}
						secureTextEntry={true}
						placeholder='Password'
						confirmTitle='Delete Account'
						confirmBackgroundColor={colors.buttonBackgroundDangerDefault}
						onSubmit={value => alert(`Account deletion confirmed with password: ${'*'.repeat(value.length)}`)}
					/>
				)
			});
		};

		return <TriggerButton title='Show With Icon & Description' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};

export const WithCustomText = () => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();
		const { colors } = React.useContext(ThemeContext);

		const CustomTextComponent = (
			<View style={{ marginTop: 12, marginBottom: 12 }}>
				<Text style={{ color: colors.fontDanger, fontSize: 14, fontWeight: 'bold' }}>⚠️ Warning:</Text>
				<Text style={{ color: colors.fontSecondaryInfo, fontSize: 14, marginTop: 4 }}>
					This action cannot be undone. All your data will be permanently deleted.
				</Text>
			</View>
		);

		const handlePress = () => {
			showActionSheet({
				children: (
					<ActionSheetContentWithInputAndSubmit
						title='Confirm deletion'
						description='Type your password to proceed'
						testID='custom-text'
						customText={CustomTextComponent}
						secureTextEntry={true}
						confirmTitle='Delete'
						confirmBackgroundColor={colors.buttonBackgroundDangerDefault}
						onSubmit={() => alert('Deletion confirmed')}
					/>
				)
			});
		};

		return <TriggerButton title='Show With Custom Text' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};

export const ConfirmationOnly = () => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();
		const { colors } = React.useContext(ThemeContext);

		const handlePress = () => {
			showActionSheet({
				children: (
					<ActionSheetContentWithInputAndSubmit
						title='Are you sure?'
						description='This action will permanently delete all messages in this room. This cannot be undone.'
						testID='confirmation-only'
						iconName='warning'
						iconColor={colors.buttonBackgroundDangerDefault}
						showInput={false}
						confirmTitle='Yes, Delete'
						confirmBackgroundColor={colors.buttonBackgroundDangerDefault}
						onSubmit={() => alert('Action confirmed!')}
					/>
				)
			});
		};

		return <TriggerButton title='Show Confirmation Only (No Input)' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};

export const CustomButtonColors = () => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();

		const handlePress = () => {
			showActionSheet({
				children: (
					<ActionSheetContentWithInputAndSubmit
						title='Save changes'
						description='Enter a name for your settings'
						testID='custom-colors'
						secureTextEntry={false}
						placeholder='Settings name'
						confirmTitle='Save'
						confirmBackgroundColor='#10B981'
						onSubmit={value => alert(`Saved: ${value}`)}
					/>
				)
			});
		};

		return <TriggerButton title='Show Custom Button Colors' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};

export const CustomValidation = () => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();

		const handlePress = () => {
			showActionSheet({
				children: (
					<ActionSheetContentWithInputAndSubmit
						title='Create new room'
						description='Room name must be at least 3 characters'
						testID='custom-validation'
						secureTextEntry={false}
						placeholder='Room name'
						confirmTitle='Create'
						isDisabled={inputValues => {
							// Custom validation: disable if input is less than 3 characters
							if (Array.isArray(inputValues)) {
								return inputValues[0].length < 3;
							}
							return (inputValues as string).length < 3;
						}}
						onSubmit={value => alert(`Room created: ${value}`)}
					/>
				)
			});
		};

		return <TriggerButton title='Show Custom Validation' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};

export const WithAutoComplete = () => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();

		const handlePress = () => {
			showActionSheet({
				children: (
					<ActionSheetContentWithInputAndSubmit
						title='Sign in'
						description='Enter your email address'
						testID='auto-complete'
						secureTextEntry={false}
						placeholder='Email'
						autoComplete='email'
						confirmTitle='Continue'
						onSubmit={value => alert(`Email: ${value}`)}
					/>
				)
			});
		};

		return <TriggerButton title='Show With AutoComplete' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};

export const CustomOnCancel = () => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();

		const handlePress = () => {
			showActionSheet({
				children: (
					<ActionSheetContentWithInputAndSubmit
						title='Edit message'
						description='Make changes to your message'
						testID='custom-cancel'
						secureTextEntry={false}
						placeholder='Message text'
						confirmTitle='Save'
						onSubmit={value => alert(`Saved: ${value}`)}
						onCancel={() => alert('Edit cancelled!')}
					/>
				)
			});
		};

		return <TriggerButton title='Show With Custom Cancel' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};

const ThemeStory = ({ theme }: { theme: TSupportedThemes }) => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();
		const { colors } = React.useContext(ThemeContext);

		const handlePress = () => {
			showActionSheet({
				children: (
					<ActionSheetContentWithInputAndSubmit
						title='Delete your account'
						description='For your security, you must enter your current password to continue'
						testID='theme-story'
						iconName='warning'
						iconColor={colors.buttonBackgroundDangerDefault}
						secureTextEntry={true}
						placeholder='Password'
						confirmTitle='Delete Account'
						confirmBackgroundColor={colors.buttonBackgroundDangerDefault}
						onSubmit={() => alert('Account deletion confirmed')}
					/>
				)
			});
		};

		return <TriggerButton title={`Show Input Form (${theme} theme)`} onPress={handlePress} />;
	};

	return (
		<ThemeContext.Provider value={{ theme, colors: themes[theme] }}>
			<StoryWrapper>
				<Component />
			</StoryWrapper>
		</ThemeContext.Provider>
	);
};

export const LightTheme = () => <ThemeStory theme='light' />;

export const DarkTheme = () => <ThemeStory theme='dark' />;

export const BlackTheme = () => <ThemeStory theme='black' />;
