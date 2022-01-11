import Model from '@nozbe/watermelondb/Model';

export interface IFrequentlyUsedEmoji {
	content?: string;
	extension?: string;
	isCustom: boolean;
	count: number;
}

export type TFrequentlyUsedEmoji = IFrequentlyUsedEmoji & Model;
