import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, type Dispatch, type SetStateAction, type ReactElement } from 'react';
import { Alert, View } from 'react-native';
import { useEventListener } from 'expo';

import { styles } from './styles';
import { useAppNavigation } from '../../lib/hooks/navigation';
import I18n from '../../i18n';
import { type IAttachment } from '../../definitions';
import { formatAttachmentUrl, encodeAttachmentUrl } from '../../lib/methods/helpers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface IVideoPlayerProps {
	attachment: IAttachment;
	user: { id: string; token: string };
	baseUrl: string;
	setLoading: Dispatch<SetStateAction<boolean>>;
}

const VideoPlayer = ({ attachment, user, baseUrl, setLoading }: IVideoPlayerProps): ReactElement => {
	const navigation = useAppNavigation();
	const hasHandledErrorRef = useRef(false);
	const { bottom } = useSafeAreaInsets();

	const url = formatAttachmentUrl(attachment.title_link || attachment.video_url, user.id, user.token, baseUrl);
	const uri = encodeAttachmentUrl(url);

	const player = useVideoPlayer(uri, player => {
		player.play();
	});

	useEventListener(player, 'statusChange', ({ status }) => {
		if (status === 'readyToPlay') {
			setLoading(false);
		} else if (status === 'error' && !hasHandledErrorRef.current) {
			hasHandledErrorRef.current = true;
			setLoading(false);
			Alert.alert(I18n.t('Error'), I18n.t('There_was_an_error_while_playing_video'));
			navigation.goBack();
		}
	});

	useEffect(() => {
		hasHandledErrorRef.current = false;
	}, [uri]);

	useEffect(() => {
		const blurSub = navigation.addListener('blur', () => {
			player.pause();
		});
		return () => {
			blurSub();
		};
	}, [navigation, player]);

	return (
		<View style={[styles.container, { paddingBottom: bottom }]}>
			<VideoView player={player} style={styles.container} contentFit='contain' nativeControls allowsFullscreen allowsPictureInPicture />
		</View>
	);
};

export default VideoPlayer;
