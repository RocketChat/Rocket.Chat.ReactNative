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
            url,
            title,
            description,
            image,
        },
        createdAt,
        createdByUser {
            firstName,
            lastName,
            username,
        },
        createdAt,
        teamChannelId,
        updatedAt,
        balls,
        balled
    }
`;
