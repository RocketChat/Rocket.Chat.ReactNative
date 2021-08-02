import {TChannel} from "../markdown/Hashtag";

export type TMessageAttachments = {
    attachments: any;
    timeFormat: string;
    showAttachment: Function;
    getCustomEmoji: Function;
    theme: string;
}

export type TMessageAvatar = {
    isHeader: boolean;
    avatar: string;
    emoji: string;
    author: {
        username: string
        _id: string;
    };
    small?: boolean;
    navToRoomInfo: Function;
    getCustomEmoji(): void;
    theme: string;
}

export type TMessageBlocks = {
    blocks: any;
    id: string;
    rid: string;
    blockAction: Function;
}

export type TMessageBroadcast = {
    author: {
        _id: string
    };
    broadcast: boolean;
    theme: string
}

export type TMessageCallButton = {
    theme: string;
    callJitsi: Function;
}

export type TMessageContent = {
    isTemp: boolean;
    isInfo: boolean;
    tmid: string;
    isThreadRoom: boolean;
    msg: string;
    theme: string;
    isEdited: boolean;
    isEncrypted: boolean;
    getCustomEmoji: Function;
    channels: TChannel[];
    mentions: object[];
    navToRoomInfo: Function;
    useRealName: boolean;
    isIgnored: boolean;
    type: string;
}

export type TMessageDiscussion = {
    msg: string;
    dcount: number;
    dlm: string;
    theme: string;
}

export type TMessageThread = {
    msg: string;
    tcount: number;
    theme: string;
    tlm: string;
    isThreadRoom: boolean;
    id: string;
}

export type TMessageRepliedThread = {
    tmid: string;
    tmsg: string;
    id: string;
    isHeader: boolean;
    theme: string;
    fetchThreadName: Function;
    isEncrypted: boolean;
}

export type TMessageInner = {
    type: string;
    blocks: [];
} & TMessageDiscussion & TMessageContent & TMessageCallButton & TMessageBlocks
    & TMessageThread & TMessageAttachments & TMessageBroadcast;

export type TMessage = {
    isThreadReply: boolean;
    isThreadSequential: boolean;
    isInfo: boolean;
    isTemp: boolean;
    isHeader: boolean;
    hasError: boolean;
    style: any;
    onLongPress: Function;
    isReadReceiptEnabled: boolean;
    unread: boolean;
    theme: string;
    isIgnored: boolean;
} & TMessageRepliedThread & TMessageAvatar & TMessageContent & TMessageInner;