import gql from "graphql-tag";

export const TIMELINE = gql`
    query Timeline($offset: Int, $limit: Int) {
        getThreads(offset: $offset, limit: $limit){
            threads {
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
                },
                createdAt,
                balls,
                balled
            }
            total,
            limit,
            offset,
        }
    }
`;

export const PREVIEW_METADATA = gql`
    query Preview($type: ContentType!, $url: String!) {
        getPreviewMetadata(type: $type, url: $url) {
            url,
            title,
            description,
            image,
        }
    }
`;
