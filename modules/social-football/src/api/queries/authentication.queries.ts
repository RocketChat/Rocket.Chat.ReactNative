import gql from 'graphql-tag';

/**
 * OBSOLETE
 * Retrieves the logged-in userrname.
 * 
 * @returns {me}
 */
export const GET_ME = gql`
    query GetMe {
        me
    }
`;

/**
 * Check if User is Authenticated.
 * 
 * @returns {isAuthenticated} bool
 */
export const IS_AUTHENTICATED = gql`
    {
        isAuthenticated @client
    }
`