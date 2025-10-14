import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Item } from './Item';
import { CustomIcon } from '../CustomIcon';
import { ThemeContext, TSupportedThemes } from '../../theme';
import { themes } from '../../lib/constants/colors';
import { longText } from '../../../.rnstorybook/utils';

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	itemWrapper: {
		marginBottom: 1
	}
});

export default {
	title: 'ActionSheet/Item'
};

const mockHide = () => alert('Action sheet would hide');

const Wrapper = ({ children }: { children: React.ReactNode }) => (
	<ThemeContext.Provider value={{ theme: 'light', colors: themes.light }}>
		<View style={styles.container}>{children}</View>
	</ThemeContext.Provider>
);

export const BasicItem = () => (
	<Wrapper>
		<View style={styles.itemWrapper}>
			<Item
				item={{
					title: 'Basic Item',
					onPress: () => alert('Basic item pressed')
				}}
				hide={mockHide}
			/>
		</View>
	</Wrapper>
);

export const ItemWithIcon = () => (
	<Wrapper>
		<View style={styles.itemWrapper}>
			<Item
				item={{
					title: 'Item with Camera Icon',
					icon: 'camera-photo',
					onPress: () => alert('Camera icon item pressed')
				}}
				hide={mockHide}
			/>
		</View>
		<View style={styles.itemWrapper}>
			<Item
				item={{
					title: 'Item with Edit Icon',
					icon: 'edit',
					onPress: () => alert('Edit icon item pressed')
				}}
				hide={mockHide}
			/>
		</View>
		<View style={styles.itemWrapper}>
			<Item
				item={{
					title: 'Item with Delete Icon',
					icon: 'delete',
					onPress: () => alert('Delete icon item pressed')
				}}
				hide={mockHide}
			/>
		</View>
	</Wrapper>
);

export const ItemWithSubtitle = () => (
	<Wrapper>
		<View style={styles.itemWrapper}>
			<Item
				item={{
					title: 'Item with Subtitle',
					subtitle: 'This is a subtitle',
					onPress: () => alert('Item with subtitle pressed')
				}}
				hide={mockHide}
			/>
		</View>
		<View style={styles.itemWrapper}>
			<Item
				item={{
					title: 'With Icon and Subtitle',
					subtitle: 'Additional information here',
					icon: 'emoji',
					onPress: () => alert('Item pressed')
				}}
				hide={mockHide}
			/>
		</View>
		<View style={styles.itemWrapper}>
			<Item
				item={{
					title: 'Long Subtitle',
					subtitle: longText,
					icon: 'info',
					onPress: () => alert('Item pressed')
				}}
				hide={mockHide}
			/>
		</View>
	</Wrapper>
);

export const ItemWithRightComponent = () => {
	const { colors } = React.useContext(ThemeContext);

	return (
		<Wrapper>
			<View style={styles.itemWrapper}>
				<Item
					item={{
						title: 'Selected Item',
						onPress: () => alert('Selected item pressed'),
						right: () => <CustomIcon name='check' size={20} color={colors.strokeHighlight} />
					}}
					hide={mockHide}
				/>
			</View>
			<View style={styles.itemWrapper}>
				<Item
					item={{
						title: 'With Icon and Right Component',
						icon: 'star',
						onPress: () => alert('Item pressed'),
						right: () => <CustomIcon name='check' size={20} color={colors.strokeHighlight} />
					}}
					hide={mockHide}
				/>
			</View>
		</Wrapper>
	);
};

export const DangerItem = () => (
	<Wrapper>
		<View style={styles.itemWrapper}>
			<Item
				item={{
					title: 'Delete',
					danger: true,
					onPress: () => alert('Delete pressed')
				}}
				hide={mockHide}
			/>
		</View>
		<View style={styles.itemWrapper}>
			<Item
				item={{
					title: 'Delete with Icon',
					icon: 'delete',
					danger: true,
					onPress: () => alert('Delete pressed')
				}}
				hide={mockHide}
			/>
		</View>
		<View style={styles.itemWrapper}>
			<Item
				item={{
					title: 'Remove from Team',
					subtitle: 'This action cannot be undone',
					icon: 'close',
					danger: true,
					onPress: () => alert('Remove pressed')
				}}
				hide={mockHide}
			/>
		</View>
	</Wrapper>
);

export const DisabledItem = () => (
	<Wrapper>
		<View style={styles.itemWrapper}>
			<Item
				item={{
					title: 'Disabled Item',
					enabled: false,
					onPress: () => alert('This should not appear')
				}}
				hide={mockHide}
			/>
		</View>
		<View style={styles.itemWrapper}>
			<Item
				item={{
					title: 'Disabled with Icon',
					icon: 'info',
					enabled: false,
					onPress: () => alert('This should not appear')
				}}
				hide={mockHide}
			/>
		</View>
		<View style={styles.itemWrapper}>
			<Item
				item={{
					title: 'Disabled with Subtitle',
					subtitle: 'You need permission to perform this action',
					icon: 'pin',
					enabled: false,
					onPress: () => alert('This should not appear')
				}}
				hide={mockHide}
			/>
		</View>
	</Wrapper>
);

export const AllStates = () => {
	const { colors } = React.useContext(ThemeContext);

	return (
		<Wrapper>
			<View style={styles.itemWrapper}>
				<Item
					item={{
						title: 'Regular Item',
						icon: 'emoji',
						onPress: () => alert('Regular pressed')
					}}
					hide={mockHide}
				/>
			</View>
			<View style={styles.itemWrapper}>
				<Item
					item={{
						title: 'With Subtitle',
						subtitle: 'Additional information',
						icon: 'info',
						onPress: () => alert('Subtitle item pressed')
					}}
					hide={mockHide}
				/>
			</View>
			<View style={styles.itemWrapper}>
				<Item
					item={{
						title: 'With Right Component',
						icon: 'star',
						onPress: () => alert('Right component item pressed'),
						right: () => <CustomIcon name='check' size={20} color={colors.strokeHighlight} />
					}}
					hide={mockHide}
				/>
			</View>
			<View style={styles.itemWrapper}>
				<Item
					item={{
						title: 'Disabled Item',
						icon: 'info',
						enabled: false,
						onPress: () => {}
					}}
					hide={mockHide}
				/>
			</View>
			<View style={styles.itemWrapper}>
				<Item
					item={{
						title: 'Danger Item',
						icon: 'delete',
						danger: true,
						onPress: () => alert('Danger pressed')
					}}
					hide={mockHide}
				/>
			</View>
		</Wrapper>
	);
};

const ThemeStory = ({ theme }: { theme: TSupportedThemes }) => {
	const Component = () => {
		const { colors } = React.useContext(ThemeContext);

		return (
			<View style={styles.container}>
				<View style={styles.itemWrapper}>
					<Item
						item={{
							title: 'Regular Item',
							subtitle: 'With subtitle',
							icon: 'emoji',
							onPress: () => alert('Regular pressed')
						}}
						hide={mockHide}
					/>
				</View>
				<View style={styles.itemWrapper}>
					<Item
						item={{
							title: 'Selected Item',
							icon: 'star',
							onPress: () => alert('Selected pressed'),
							right: () => <CustomIcon name='check' size={20} color={colors.strokeHighlight} />
						}}
						hide={mockHide}
					/>
				</View>
				<View style={styles.itemWrapper}>
					<Item
						item={{
							title: 'Disabled Item',
							icon: 'info',
							enabled: false,
							onPress: () => {}
						}}
						hide={mockHide}
					/>
				</View>
				<View style={styles.itemWrapper}>
					<Item
						item={{
							title: 'Danger Item',
							icon: 'delete',
							danger: true,
							onPress: () => alert('Danger pressed')
						}}
						hide={mockHide}
					/>
				</View>
			</View>
		);
	};

	return (
		<ThemeContext.Provider value={{ theme, colors: themes[theme] }}>
			<Component />
		</ThemeContext.Provider>
	);
};

export const LightTheme = () => <ThemeStory theme='light' />;

export const DarkTheme = () => <ThemeStory theme='dark' />;

export const BlackTheme = () => <ThemeStory theme='black' />;
