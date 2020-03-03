import gql from "graphql-tag";

/**
 * Get all information needed to show the Timeline page.
 * 
 * @param Timeline(Int, Int)
 * @returns {getThreads<threads>}
 */
export const TIMELINE = gql`
    query Timeline($offset: Int, $limit: Int) {
        getThreads(offset: $offset, limit: $limit){
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

/**
 * Get all information needed to preview a Thread.
 * 
 * @param Preview(ContentType, String)
 * @returns {getPreviewMetadata}
 */
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
