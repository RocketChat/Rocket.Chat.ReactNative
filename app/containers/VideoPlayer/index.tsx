import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, type Dispatch, type SetStateAction, type ReactElement } from 'react';
import { Alert } from 'react-native';
import { useEventListener } from 'expo';

import { useAppNavigation } from '../../lib/hooks/navigation';
import I18n from '../../i18n';
import { type IAttachment } from '../../definitions';
import { formatAttachmentUrl } from '../../lib/methods/helpers';

interface IVideoPlayerProps {
	attachment: IAttachment;
	user: { id: string; token: string };
	baseUrl: string;
	setLoading: Dispatch<SetStateAction<boolean>>;
}

const VideoPlayer = ({ attachment, user, baseUrl, setLoading }: IVideoPlayerProps): ReactElement => {
	const navigation = useAppNavigation();
	const hasHandledErrorRef = useRef(false);

	const url = formatAttachmentUrl(attachment.title_link || attachment.video_url, user.id, user.token, baseUrl);
	const uri = encodeURI(url);

	const player = useVideoPlayer(uri, player => {
		player.play();
	});

	useEventListener(player, 'statusChange', ({ status }) => {
		if (status === 'readyToPlay') {
			setLoading(false);
		} else if (status === 'error' && !hasHandledErrorRef.current) {
			hasHandledErrorRef.current = true;
			setLoading(false);
			Alert.alert(I18n.t('Error'), I18n.t('There_was_an_error_while_action', { action: I18n.t('playing_video') }));
			navigation.goBack();
		}
	});

	useEffect(() => {
		const blurSub = navigation.addListener('blur', () => {
			player.pause();
		});
		return () => {
			blurSub();
		};
	}, [navigation, player]);

	return (
		<VideoView player={player} style={{ flex: 1 }} contentFit='contain' nativeControls allowsFullscreen allowsPictureInPicture />
	);
};

export default VideoPlayer;
