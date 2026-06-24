import { ScrollView } from 'react-native';

import { longText } from '../../../../.rnstorybook/utils';
import { type TSupportedThemes } from '../../../theme';
import { Message } from '../../../containers/message/Message.stories';
import { MessageTypeLoad } from '../../../lib/constants/messageTypeLoad';
import { themes } from '../../../lib/constants/colors';
import LoadMoreComponent from '.';
import ThemeStory from '../../../stories/ThemeStory';

export default {
	title: 'RoomView/LoadMore'
};

const LoadMore = ({ ...props }) => (
	<LoadMoreComponent rid='rid' t='c' loaderId='loaderId' type={MessageTypeLoad.MORE} runOnRender={false} {...props} />
);

export const Basic = () => (
	<>
		<LoadMore loaderId='1' />
		<LoadMore loaderId='2' runOnRender />
		<LoadMore loaderId='3' type={MessageTypeLoad.PREVIOUS_CHUNK} />
		<LoadMore loaderId='4' type={MessageTypeLoad.NEXT_CHUNK} />
	</>
);

const ThemeVariant = ({ theme }: { theme: TSupportedThemes }) => (
	<ThemeStory theme={theme}>
		<ScrollView style={{ backgroundColor: themes[theme].surfaceRoom }}>
			<LoadMore loaderId='5' type={MessageTypeLoad.PREVIOUS_CHUNK} />
			<Message msg='Hey!' theme={theme} />
			<Message msg={longText} theme={theme} isHeader={false} />
			<Message msg='Older message' theme={theme} isHeader={false} />
			<LoadMore loaderId='6' type={MessageTypeLoad.NEXT_CHUNK} />
			<LoadMore loaderId='7' type={MessageTypeLoad.MORE} />
			<Message msg={longText} theme={theme} />
			<Message msg='This is the third message' isHeader={false} theme={theme} />
			<Message msg='This is the second message' isHeader={false} theme={theme} />
			<Message msg='This is the first message' theme={theme} />
		</ScrollView>
	</ThemeStory>
);

export const LightTheme = () => <ThemeVariant theme='light' />;

export const DarkTheme = () => <ThemeVariant theme='dark' />;

export const BlackTheme = () => <ThemeVariant theme='black' />;
