module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            [
                'module-resolver',
                {
                    root: ['./'],
                    alias: {
                        '@': './src',
                    },
                    extensions: ['.ios.ts', '.android.ts', '.ts', '.tsx', '.json'],
                },
            ],
            'react-native-reanimated/plugin', // Must be last
        ],
    };
};
