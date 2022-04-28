import Model from '@nozbe/watermelondb/Model';

// TODO: evaluate unification with IEmoji
export interface IFrequentlyUsedEmoji {
	content?: string;
	extension?: string;
	isCustom: boolean;
	count: number;
}

export type TFrequentlyUsedEmojiModel = IFrequentlyUsedEmoji & Model;
