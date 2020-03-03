import gql from "graphql-tag";

export const TIMELINE = gql`
    query Timeline($offset: Int, $limit: Int, $published: boolean) {
        getThreads(offset: $offset, limit: $limit, published: $published){
            threads {
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
                createdAt
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
