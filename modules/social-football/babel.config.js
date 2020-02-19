module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    node: 'current'
                }
            }
        ],
        '@babel/preset-typescript',
        '@babel/preset-react',
        'module:metro-react-native-babel-preset'
    ],
    plugins: [
        [
            '@babel/transform-runtime',
            {
                regenerator: true
            }
        ],
        ['@babel/plugin-proposal-decorators', { legacy: true }]
    ]
};
