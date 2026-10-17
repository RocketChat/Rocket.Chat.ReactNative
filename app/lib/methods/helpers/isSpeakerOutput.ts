const SPEAKER_OUTPUTS = ['force_speaker', 'speaker'];

export const isSpeakerOutput = (output: string): boolean => SPEAKER_OUTPUTS.includes(output);
