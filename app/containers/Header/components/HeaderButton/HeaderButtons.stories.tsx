import { type ReactElement } from 'react';
import { View } from 'react-native';
import { Header, HeaderBackground, SafeAreaProviderCompat } from '@react-navigation/elements';
import { NavigationContainer } from '@react-navigation/native';

import * as HeaderButton from '.';
import { type TColors, type TSupportedThemes } from '../../../../theme';
import { colors } from '../../../../lib/constants/colors';
import ThemeStory from '../../../../stories/ThemeStory';

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
					<HeaderButton.Item iconName='threads' badge={() => <HeaderButton.BadgeUnread tunread={[1]} />} />
					<HeaderButton.Item iconName='threads' badge={() => <HeaderButton.BadgeUnread tunread={[1]} tunreadUser={[1]} />} />
					<HeaderButton.Item iconName='threads' badge={() => <HeaderButton.BadgeUnread tunread={[1]} tunreadGroup={[1]} />} />
					<HeaderButton.Drawer badge={() => <HeaderButton.BadgeWarn color='red' />} />
				</HeaderButton.Container>
			)}
		/>
	</>
);

const ThemeVariant = ({ theme }: { theme: TSupportedThemes }) => (
	<ThemeStory theme={theme}>
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
						<HeaderButton.Item iconName='threads' badge={() => <HeaderButton.BadgeUnread tunread={[1]} />} />
					</HeaderButton.Container>
				)}
				colors={colors[theme]}
			/>
		</View>
	</ThemeStory>
);

export const ThemeLight = () => <ThemeVariant theme='light' />;
export const ThemeDark = () => <ThemeVariant theme='dark' />;
export const ThemeBlack = () => <ThemeVariant theme='black' />;

export const Common = () => (
	<>
		<HeaderExample left={() => <HeaderButton.Drawer />} />
		<HeaderExample left={() => <HeaderButton.CloseModal />} />
		<HeaderExample left={() => <HeaderButton.CancelModal />} />
		<HeaderExample right={() => <HeaderButton.More />} />
		<HeaderExample right={() => <HeaderButton.Download />} />
		<HeaderExample right={() => <HeaderButton.Preferences />} />
		<HeaderExample right={() => <HeaderButton.Legal />} />
	</>
);
