import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import { ActionSheetProvider, useActionSheet } from './Provider';
import Button from '../Button';
import { CustomIcon } from '../CustomIcon';
import { ThemeContext, TSupportedThemes } from '../../theme';
import { themes } from '../../lib/constants/colors';
import SafeAreaView from '../SafeAreaView';
import { longText } from '../../../.rnstorybook/utils';
import { SupportedVersionsWarning } from '../SupportedVersions/SupportedVersionsWarning';
import { mockedStore as store } from '../../reducers/mockedStore';
import { setSupportedVersions } from '../../actions/supportedVersions';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16
	},
	button: {
		marginBottom: 12
	},
	customContentText: {
		fontSize: 16,
		marginBottom: 12
	},
	scrollContent: {
		padding: 20,
		height: 800
	}
});

export default {
	title: 'ActionSheet'
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

export const BasicOptions = () => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();

		const handlePress = () => {
			showActionSheet({
				options: [
					{
						title: 'Option 1',
						onPress: () => alert('Option 1 pressed')
					},
					{
						title: 'Option 2',
						onPress: () => alert('Option 2 pressed')
					},
					{
						title: 'Option 3',
						onPress: () => alert('Option 3 pressed')
					}
				]
			});
		};

		return <TriggerButton title='Show Basic Options' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};

export const OptionsWithIcons = () => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();

		const handlePress = () => {
			showActionSheet({
				options: [
					{
						title: 'Take a photo',
						icon: 'camera-photo',
						onPress: () => alert('Camera opened')
					},
					{
						title: 'Take a video',
						icon: 'camera',
						onPress: () => alert('Video camera opened')
					},
					{
						title: 'Choose from library',
						icon: 'image',
						onPress: () => alert('Library opened')
					},
					{
						title: 'Choose file',
						icon: 'attach',
						onPress: () => alert('File picker opened')
					}
				]
			});
		};

		return <TriggerButton title='Show Options with Icons' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};

export const OptionsWithSubtitles = () => {
	const Component = () => {
		const { showActionSheet, hideActionSheet } = useActionSheet();

		const handlePress = () => {
			showActionSheet({
				options: [
					{
						title: 'Toasts',
						subtitle: 'Dismissed automatically',
						onPress: () => {
							hideActionSheet();
							alert('Toasts selected');
						}
					},
					{
						title: 'Dialogs',
						subtitle: 'Require manual dismissal',
						onPress: () => {
							hideActionSheet();
							alert('Dialogs selected');
						}
					},
					{
						title: 'Long subtitle example',
						subtitle: longText,
						onPress: () => {
							hideActionSheet();
							alert('Long subtitle selected');
						}
					}
				]
			});
		};

		return <TriggerButton title='Show Options with Subtitles' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};

export const OptionsWithRightComponents = () => {
	const Component = () => {
		const { showActionSheet, hideActionSheet } = useActionSheet();
		const { colors } = React.useContext(ThemeContext);

		const handlePress = () => {
			showActionSheet({
				options: [
					{
						title: 'English',
						onPress: () => {
							hideActionSheet();
							alert('English selected');
						},
						right: () => <CustomIcon name='check' size={20} color={colors.strokeHighlight} />
					},
					{
						title: 'Spanish',
						onPress: () => {
							hideActionSheet();
							alert('Spanish selected');
						}
					},
					{
						title: 'French',
						onPress: () => {
							hideActionSheet();
							alert('French selected');
						}
					}
				]
			});
		};

		return <TriggerButton title='Show Options with Right Components' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};

export const OptionsWithCancelButton = () => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();

		const handlePress = () => {
			showActionSheet({
				options: [
					{
						title: 'Resend',
						icon: 'send',
						onPress: () => alert('Message resent')
					},
					{
						title: 'Delete',
						icon: 'delete',
						danger: true,
						onPress: () => alert('Message deleted')
					}
				],
				hasCancel: true
			});
		};

		return <TriggerButton title='Show Options with Cancel' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};

export const DangerOptions = () => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();

		const handlePress = () => {
			showActionSheet({
				options: [
					{
						title: 'Edit',
						icon: 'edit',
						onPress: () => alert('Edit pressed')
					},
					{
						title: 'Delete',
						icon: 'delete',
						danger: true,
						onPress: () => alert('Delete pressed')
					},
					{
						title: 'Remove from team',
						icon: 'close',
						danger: true,
						onPress: () => alert('Remove pressed')
					}
				],
				hasCancel: true
			});
		};

		return <TriggerButton title='Show Danger Options' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};

export const DisabledOptions = () => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();

		const handlePress = () => {
			showActionSheet({
				options: [
					{
						title: 'Enabled option',
						icon: 'emoji',
						onPress: () => alert('Enabled pressed')
					},
					{
						title: 'Disabled option',
						icon: 'locker',
						enabled: false,
						onPress: () => alert('This should not appear')
					},
					{
						title: 'Another enabled option',
						icon: 'check',
						onPress: () => alert('Another enabled pressed')
					}
				]
			});
		};

		return <TriggerButton title='Show Disabled Options' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};

export const MixedStates = () => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();
		const { colors } = React.useContext(ThemeContext);

		const handlePress = () => {
			showActionSheet({
				options: [
					{
						title: 'Edit message',
						subtitle: 'You can edit this message',
						icon: 'edit',
						onPress: () => alert('Edit pressed')
					},
					{
						title: 'Copy',
						icon: 'copy',
						onPress: () => alert('Copy pressed')
					},
					{
						title: 'Pin message',
						subtitle: 'You need permission',
						icon: 'pin',
						enabled: false,
						onPress: () => {}
					},
					{
						title: 'Star',
						icon: 'star',
						onPress: () => alert('Star pressed'),
						right: () => <CustomIcon name='check' size={20} color={colors.strokeHighlight} />
					},
					{
						title: 'Delete',
						icon: 'delete',
						danger: true,
						onPress: () => alert('Delete pressed')
					}
				],
				hasCancel: true
			});
		};

		return <TriggerButton title='Show Mixed States' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};

export const CustomHeader = () => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();
		const { colors } = React.useContext(ThemeContext);

		const CustomHeaderComponent = (
			<View style={{ padding: 16, backgroundColor: colors.surfaceLight }}>
				<Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.fontDefault, marginBottom: 8 }}>Custom Header Title</Text>
				<Text style={{ fontSize: 14, color: colors.fontSecondaryInfo }}>
					This is a custom header component that can contain any React elements
				</Text>
			</View>
		);

		const handlePress = () => {
			showActionSheet({
				customHeader: CustomHeaderComponent,
				headerHeight: 80,
				options: [
					{
						title: 'Option 1',
						onPress: () => alert('Option 1')
					},
					{
						title: 'Option 2',
						onPress: () => alert('Option 2')
					},
					{
						title: 'Option 3',
						onPress: () => alert('Option 3')
					}
				]
			});
		};

		return <TriggerButton title='Show with Custom Header' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};

export const LongOptionsList = () => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();

		const handlePress = () => {
			const options = Array.from({ length: 15 }, (_, i) => ({
				title: `Option ${i + 1}`,
				icon: i % 2 === 0 ? ('emoji' as const) : undefined,
				onPress: () => alert(`Option ${i + 1} pressed`)
			}));

			showActionSheet({
				options,
				hasCancel: true
			});
		};

		return <TriggerButton title='Show Long Options List' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};

export const CustomChildrenWithSnaps = () => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();
		const { colors } = React.useContext(ThemeContext);

		const handlePress = () => {
			showActionSheet({
				children: (
					<ScrollView style={styles.scrollContent}>
						<Text style={[styles.customContentText, { color: colors.fontDefault, fontSize: 18, fontWeight: 'bold' }]}>
							Scrollable Content
						</Text>
						{Array.from({ length: 20 }, (_, i) => (
							<Text key={i} style={[styles.customContentText, { color: colors.fontSecondaryInfo }]}>
								Line {i + 1}: {longText}
							</Text>
						))}
					</ScrollView>
				),
				snaps: ['50%', '90%']
			});
		};

		return <TriggerButton title='Show Custom Children with Snaps' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};

export const OnCloseCallback = () => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();

		const handlePress = () => {
			showActionSheet({
				options: [
					{
						title: 'Option 1',
						onPress: () => alert('Option 1')
					},
					{
						title: 'Option 2',
						onPress: () => alert('Option 2')
					}
				],
				hasCancel: true,
				onClose: () => alert('Action sheet was closed!')
			});
		};

		return <TriggerButton title='Show with onClose Callback' onPress={handlePress} />;
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
				options: [
					{
						title: 'Edit',
						subtitle: 'Make changes to the message',
						icon: 'edit',
						onPress: () => alert('Edit')
					},
					{
						title: 'Copy',
						icon: 'copy',
						onPress: () => alert('Copy'),
						right: () => <CustomIcon name='check' size={20} color={colors.strokeHighlight} />
					},
					{
						title: 'Pin (disabled)',
						icon: 'pin',
						enabled: false,
						onPress: () => {}
					},
					{
						title: 'Delete',
						icon: 'delete',
						danger: true,
						onPress: () => alert('Delete')
					}
				],
				hasCancel: true
			});
		};

		return <TriggerButton title={`Show ActionSheet (${theme} theme)`} onPress={handlePress} />;
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

export const WithSupportedVersionsWarning = () => {
	const Component = () => {
		const { showActionSheet } = useActionSheet();

		React.useEffect(() => {
			store.dispatch(
				setSupportedVersions({
					status: 'warn',
					message: {
						remainingDays: 30,
						type: 'alert',
						title: 'title_key',
						subtitle: 'subtitle_key',
						description: 'description_key',
						link: 'https://rocket.chat/docs'
					},
					i18n: {
						en: {
							title_key: 'Update Required',
							subtitle_key: 'Your workspace version is outdated',
							description_key:
								'Please update your Rocket.Chat server to continue using this app. Your current version will stop working soon.'
						}
					},
					expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
				})
			);
		}, []);

		const handlePress = () => {
			showActionSheet({
				children: <SupportedVersionsWarning />
			});
		};

		return <TriggerButton title='Show Supported Versions Warning' onPress={handlePress} />;
	};

	return (
		<StoryWrapper>
			<Component />
		</StoryWrapper>
	);
};
