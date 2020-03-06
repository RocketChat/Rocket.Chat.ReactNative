import gql from 'graphql-tag';

/**
 * Create a new Thread.
 * 
 * @param ThreadInput
 * @returns {createThread<thread>}
 */
export const CREATE_THREAD = gql`
    mutation CreateThread($thread: ThreadInput!) {
        createThread(thread:$thread)
    }
`;

