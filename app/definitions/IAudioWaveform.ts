import type Model from '@nozbe/watermelondb/Model';

export interface IAudioWaveform {
	peaks: number[];
}

export type TAudioWaveformModel = IAudioWaveform & Model;
