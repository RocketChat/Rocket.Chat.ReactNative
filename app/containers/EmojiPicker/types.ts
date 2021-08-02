export type TEmoji = {
    content: any;
    name: string;
    extension: any;
    isCustom: boolean;
}

export type TCustomEmoji = {
    baseUrl: string,
    emoji: TEmoji,
    style: any
}

export type TEmojiCategory = {
    baseUrl: string;
    emojis: TEmoji[];
    onEmojiSelected({}: any): void;
    emojisPerRow: number;
    width: number;
    style: any;
    tabLabel: string;
}