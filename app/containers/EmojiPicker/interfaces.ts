export interface IEmoji {
	content: any;
	name: string;
	extension: any;
	isCustom: boolean;
}

export interface ICustomEmoji {
	baseUrl: string;
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
