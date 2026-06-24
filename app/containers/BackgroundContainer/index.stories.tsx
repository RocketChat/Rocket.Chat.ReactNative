import { type TSupportedThemes } from '../../theme';
import { longText } from '../../../.rnstorybook/utils';
import BackgroundContainer, { type IBackgroundContainer } from '.';
import ThemeStory from '../../stories/ThemeStory';

export default {
	title: 'BackgroundContainer'
};

export const Basic = () => <BackgroundContainer />;

export const Loading = () => <BackgroundContainer loading />;

export const Text = () => <BackgroundContainer text='Text here' />;

export const LongText = () => <BackgroundContainer text={longText} />;

interface ThemeStoryProps extends IBackgroundContainer {
	theme: TSupportedThemes;
}

const ThemeVariant = ({ theme, ...props }: ThemeStoryProps) => (
	<ThemeStory theme={theme}>
		<BackgroundContainer {...props} />
	</ThemeStory>
);

export const DarkThemeLoading = () => <ThemeVariant theme='dark' loading />;

export const DarkThemeText = () => <ThemeVariant theme='dark' text={longText} />;

export const BlackThemeLoading = () => <ThemeVariant theme='black' loading />;

export const BlackThemeText = () => <ThemeVariant theme='black' text={longText} />;
