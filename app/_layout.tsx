// app/_layout.tsx
// Root layout — Expo Router entry point.
// Wraps the app with ThemeProvider and global providers.

import { Slot } from 'expo-router';

export default function RootLayout() {
    return <Slot />;
}
