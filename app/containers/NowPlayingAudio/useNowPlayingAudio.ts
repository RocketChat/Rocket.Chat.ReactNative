import AudioManager from '~/lib/methods/AudioManager';
import { goRoom } from '~/lib/methods/helpers/goRoom';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { useNowPlayingAudioStore, type INowPlayingAudio } from '~/lib/methods/useNowPlayingAudioStore';
import { useNowPlayingAudioDetails } from './useNowPlayingAudioDetails';

export const useNowPlayingAudioActions = (audio: INowPlayingAudio) => {
	const isMasterDetail = useMasterDetail();
	const { title, roomName } = useNowPlayingAudioDetails(audio.rid, audio.msgId);

	const togglePlayPause = () => {
		if (audio.playing) {
			AudioManager.pauseAudio();
			return;
		}
		AudioManager.playAudio(audio.audioKey);
	};

	const close = () => AudioManager.closeAudio();

	const openSourceRoom = () => goRoom({ item: { rid: audio.rid }, isMasterDetail, jumpToMessageId: audio.msgId });

	return { title, roomName, togglePlayPause, close, openSourceRoom };
};

export const useNowPlayingAudio = () => useNowPlayingAudioStore(state => state.audio);
