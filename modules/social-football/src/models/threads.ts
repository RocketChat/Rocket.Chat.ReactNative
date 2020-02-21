import { ContentType } from "../enums/content-type";
import { AssetMetadata } from "./asset-metadata";

export interface CreateThreadModel {
    title: string;
    type: ContentType;
    description: string;
    commentsEnabled: boolean;
    published: boolean;

    assetUrl?: string;
}

export interface ThreadModel extends CreateThreadModel {
    _id?: string;
    rocketChatMessageID: string;

    assetMetadata?: AssetMetadata;
    teamChannelId: string;
    createdByUserId: string;
    createdAt: Date;
    updatedAt?: Date;
}

export interface PaginatedThreads {
    threads: ThreadModel[];
    limit: number;
    offset: number;
    total: number;
}