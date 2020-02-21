import gql from "graphql-tag";

export const TIMELINE = gql`
    query Timeline($offset: Int, $limit: Int) {
        getThreads(offset: $offset, limit: $limit){
            threads {
                type,
            }
            total,
            limit,
            offset,
        }
    }
`;
