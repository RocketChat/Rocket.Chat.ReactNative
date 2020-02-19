const { defaults } = require('jest-config');

module.exports = {
    preset: 'react-native',
    moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx'],
    modulePaths: [
        '<rootDir>/node_modules/'
    ],
    moduleNameMapper: {
        '^(.*):(.*)$': '$1_$2',
        'rn-user-defaults': '<rootDir>/tests/mocks/user-defaults.mock.ts',
        'react-navigation': '<rootDir>/tests/mocks/react-navigation.mock.tsx',
        'react-native-localize': '<rootDir>/tests/mocks/react-native-localize.mock.ts'
    },
    unmockedModulePathPatterns: [
        'node_modules/react/',
        'node_modules/enzyme/'
    ],
    testEnvironment: 'jsdom',
    verbose: true,
    coverageDirectory: '<rootDir>/coverage',
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}'
    ],
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100
        }
    },
    globals: {
        _dts_jest_: {
            enclosing_declaration: true,
            compiler_options: './tsconfig.json'
        }
    },
    transform: {
        '^.+\\.tsx?$': 'babel-jest'
    },
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|react-navigation|@react-navigation/.*))'
    ],
    coverageReporters: [
        'lcov',
        'clover',
        'text-summary'
    ],
    setupFilesAfterEnv: ['<rootDir>tests/setup.ts']
};
