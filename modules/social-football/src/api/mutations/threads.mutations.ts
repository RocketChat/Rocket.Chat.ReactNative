import gql from 'graphql-tag';

export const CREATE_THREAD = gql`
    mutation CreateThread($thread: ThreadInput!) {
        createThread(thread:$thread)
    }
`;

// export const PUBLISH_THREAD = gql`
//     mutation PublishThread($thread: ThreadInput!) {
//         PublishThread(thread:$thread)
//     }
// `;

