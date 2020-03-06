import gql from 'graphql-tag';

export const OVERVIEW = gql`
    fragment ThreadsOverview on Thread {
        _id,
        type,
        title,
        description,
        commentsEnabled,
        published,
        assetUrl,
        rocketChatMessageID,
        assetMetadata {
            title,
            description,
            image,
            url,
        },
        createdAt,
        createdByUser {
            firstName,
            lastName,
            username,
        },
        createdAt,
        teamChannelId,
        updatedAt
    }
`;
