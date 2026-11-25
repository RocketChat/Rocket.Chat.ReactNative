import { Model } from '@nozbe/watermelondb';
import { json } from '@nozbe/watermelondb/decorators';

export const AUDIO_WAVEFORMS_TABLE = 'audio_waveforms';

const sanitizePeaks = peaks => (Array.isArray(peaks) ? peaks : []);

export default class AudioWaveform extends Model {
	static table = AUDIO_WAVEFORMS_TABLE;

	@json('peaks', sanitizePeaks) peaks;
}
