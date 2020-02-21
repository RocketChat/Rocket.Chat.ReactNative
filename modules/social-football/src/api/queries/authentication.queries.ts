import gql from 'graphql-tag';

export const GET_ME = gql`
    query GetMe {
        me
    }
`;

export const IS_AUTHENTICATED = gql`
    {
        isAuthenticated @client
    }
`