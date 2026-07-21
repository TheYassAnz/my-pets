/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    // Doit précéder le mapping générique '@/(.*)' ci-dessous : Jest ne passe pas par Metro
    // et ne sait pas parser les .css (voir src/test/mocks/style-mock.js).
    '\\.css$': '<rootDir>/src/test/mocks/style-mock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(?:.pnpm/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|nativewind|react-native-css-interop))',
  ],
};
