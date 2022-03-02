export interface IEmoji {
	content: any;
	name: string;
	extension: any;
	isCustom: boolean;
}

export interface ICustomEmoji {
	baseUrl?: string;
	emoji: IEmoji;
	style: any;
}

export interface IEmojiCategory {
	baseUrl: string;
	emojis: IEmoji[];
	onEmojiSelected: Function;
	emojisPerRow: number;
	width: number;
	style: any;
	tabLabel: string;
}

// TODO: copied from reducers/customEmojis. We can unify later.
export interface IReduxEmoji {
	name: string;
	extension: any;
}

export type TGetCustomEmoji = (name: string) => any;
