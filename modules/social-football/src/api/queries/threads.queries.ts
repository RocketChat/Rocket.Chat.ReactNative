import gql from "graphql-tag";

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
