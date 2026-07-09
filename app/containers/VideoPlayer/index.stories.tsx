import { type ReactElement } from 'react';
import { View } from 'react-native';

import VideoPlayer from '.';
import { ThemeContext, type TSupportedThemes } from '../../theme';
import { themes } from '../../lib/constants/colors';

export default {
	title: 'Video Player'
};

const attachment = {
	title_link: 'https://open.rocket.chat/video.mp4',
	video_url: 'https://open.rocket.chat/video.mp4'
};

const user = { id: 'user-id', token: 'token' };

const setLoading = () => undefined;

export const Basic = (): ReactElement => (
	<VideoPlayer attachment={attachment as any} user={user} baseUrl='https://open.rocket.chat' setLoading={setLoading} />
);

const Themed = ({ theme }: { theme: TSupportedThemes }): ReactElement => (
	<ThemeContext.Provider value={{ theme, colors: themes[theme] }}>
		<View style={{ flex: 1 }}>
			<VideoPlayer attachment={attachment as any} user={user} baseUrl='https://open.rocket.chat' setLoading={setLoading} />
		</View>
	</ThemeContext.Provider>
);

export { Themed as Light, Themed as Dark };
