import { type ReactElement } from 'react';
import { View } from 'react-native';
import { Header, HeaderBackground, SafeAreaProviderCompat } from '@react-navigation/elements';
import { NavigationContainer } from '@react-navigation/native';

import * as HeaderButton from '.';
import { type TColors, ThemeContext, type TSupportedThemes } from '~/theme';
import { colors } from '~/lib/constants/colors';

interface IHeader {
	left?: () => ReactElement | null;
	right?: () => ReactElement;
	title?: string;
	colors?: TColors;
}

export default {
	title: 'HeaderButtons',
	decorators: [
		(Story: any) => (
			<NavigationContainer>
				<SafeAreaProviderCompat>
					<Story />
				</SafeAreaProviderCompat>
			</NavigationContainer>
		)
	]
};

const HeaderExample = ({ left, right, colors, title = '' }: IHeader) => (
	<Header
		title={title}
		headerLeft={left}
		headerRight={right}
		headerBackground={() => <HeaderBackground style={{ backgroundColor: colors?.surfaceNeutral }} />}
	/>
);

export const Title = () => (
	<>
		<HeaderExample
			left={() => (
				<HeaderButton.Container left>
					<HeaderButton.Item title='threads' />
				</HeaderButton.Container>
			)}
			right={() => (
				<HeaderButton.Container>
					<HeaderButton.Item title='threads' />
				</HeaderButton.Container>
			)}
		/>
		<HeaderExample
			left={() => (
				<HeaderButton.Container left>
					<HeaderButton.Item title='threads' />
					<HeaderButton.Item title='search' />
				</HeaderButton.Container>
			)}
			right={() => (
				<HeaderButton.Container>
					<HeaderButton.Item title='threads' />
					<HeaderButton.Item title='search' />
				</HeaderButton.Container>
			)}
		/>
	</>
);

export const Icons = () => (
	<>
		<HeaderExample
			left={() => (
				<HeaderButton.Container left>
					<HeaderButton.Item iconName='threads' />
				</HeaderButton.Container>
			)}
			right={() => (
				<HeaderButton.Container>
					<HeaderButton.Item iconName='threads' />
				</HeaderButton.Container>
			)}
		/>
		<HeaderExample
			left={() => (
				<HeaderButton.Container left>
					<HeaderButton.Item iconName='threads' />
					<HeaderButton.Item iconName='search' />
				</HeaderButton.Container>
			)}
			right={() => (
				<HeaderButton.Container>
					<HeaderButton.Item iconName='threads' />
					<HeaderButton.Item iconName='search' />
				</HeaderButton.Container>
			)}
		/>
	</>
);

export const Badge = () => (
	<>
		<HeaderExample
			left={() => (
				<HeaderButton.Container left>
					<HeaderButton.Item
						iconName='threads'
						badge={() => <HeaderButton.BadgeCount value={1} color={colors.light.fontSecondaryInfo} />}
					/>
					<HeaderButton.Item
						iconName='threads'
						badge={() => <HeaderButton.BadgeCount value={1} color={colors.light.badgeBackgroundLevel4} />}
					/>
					<HeaderButton.Item
						iconName='threads'
						badge={() => <HeaderButton.BadgeCount value={1} color={colors.light.badgeBackgroundLevel3} />}
					/>
					<HeaderButton.Drawer badge={() => <HeaderButton.BadgeWarn color='red' />} />
				</HeaderButton.Container>
			)}
		/>
	</>
);

const ThemeStory = ({ theme }: { theme: TSupportedThemes }) => (
	<ThemeContext.Provider value={{ theme, colors: colors[theme] }}>
		<View style={{ flexDirection: 'column' }}>
			<HeaderExample
				left={() => (
					<HeaderButton.Container left>
						<HeaderButton.Drawer badge={() => <HeaderButton.BadgeWarn color={colors[theme].buttonBackgroundDangerDefault} />} />
						<HeaderButton.Item iconName='threads' />
					</HeaderButton.Container>
				)}
				right={() => (
					<HeaderButton.Container>
						<HeaderButton.Item title='Threads' />
						<HeaderButton.Item
							iconName='threads'
							badge={() => <HeaderButton.BadgeCount value={1} color={colors[theme].fontSecondaryInfo} />}
						/>
					</HeaderButton.Container>
				)}
				colors={colors[theme]}
			/>
		</View>
	</ThemeContext.Provider>
);

export const Themes = () => (
	<>
		<ThemeStory theme='light' />
		<ThemeStory theme='dark' />
		<ThemeStory theme='black' />
	</>
);

export const Common = () => (
	<>
		<HeaderExample left={() => <HeaderButton.Drawer />} />
		<HeaderExample left={() => <HeaderButton.CancelModal />} />
		<HeaderExample right={() => <HeaderButton.More />} />
	</>
);
