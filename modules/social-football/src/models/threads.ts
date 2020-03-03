import { ContentType } from "../enums/content-type";
import { AssetMetadata } from "./asset-metadata";

/**
 * Defining the model to Create a new Thread.
 */
export interface CreateThreadModel {
    title: string;
    type: ContentType;
    description: string;
    commentsEnabled: boolean;
    published: boolean;

    assetUrl?: string;
}

/**
 * Defining the model to view an existing Thread.
 */
export interface ThreadModel extends CreateThreadModel {
    _id?: string;
    rocketChatMessageID: string;

    assetMetadata?: AssetMetadata;
    teamChannelId: string;
    createdByUserId: string;
    createdAt: Date;
    updatedAt?: Date;
}

/**
 * Defining the model to view a Thread on one Page.
 */
export interface PaginatedThreads {
    threads: ThreadModel[];
    limit: number;
    offset: number;
    total: number;
}