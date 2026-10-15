const SPEAKER_OUTPUTS = ['force_speaker', 'speaker'];
const PRIVATE_OUTPUTS_BY_PREFERENCE = ['bluetooth', 'headset', 'earpiece', 'default'];

export const isSpeakerOutput = (output: string): boolean => SPEAKER_OUTPUTS.includes(output);

export const getSpeakerOutputs = (outputs: string[]): { on?: string; off?: string } => ({
	on: SPEAKER_OUTPUTS.find(output => outputs.includes(output)),
	off: PRIVATE_OUTPUTS_BY_PREFERENCE.find(output => outputs.includes(output))
});
