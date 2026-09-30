import { type ReactElement } from 'react';

import VideoPlayer from '.';

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
