# Note Companion - Your AI-Powered Note Organizer

Note Companion is a mobile app that helps you capture, organize, and enhance your notes with AI-powered features.

## Features

- **Smart Note Organization**: Automatically categorize and organize your notes
- **Scan & Extract**: Capture physical notes and extract text with OCR
- **Local-First Storage**: Your notes stay on your device by default
- **Secure Cloud Sync**: Optional encrypted sync across devices
- **AI Enhancement**: Summarize, organize, and improve your notes
- **Simple Sharing**: Share notes with others via links or direct sharing

## Getting Started

**Important:** All commands below must be run from within the `packages/mobile` directory.

1. Install dependencies

   ```bash
   pnpm install
   ```

2. Start the app

   ```bash
   # For Android
   pnpm android

   # For iOS
   pnpm ios

   # Or start the development server
   pnpm start # Alias for npx expo start
   ```

**Development Bounty:** We are offering $50 to the first person who can refactor the mobile setup to allow building and running *perfectly* directly from the monorepo root (e.g., `pnpm run android` from the top level). See the main project README for more context.

## Privacy & Security

Note Companion prioritizes your privacy:

- Your notes are stored locally by default
- End-to-end encryption for cloud sync
- Transparent data handling practices
- No selling of your data to third parties

## Contributing

We welcome contributions! Please see our CONTRIBUTING.md file for details on how to get involved.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

Need help? Contact us at support@notecompanion.com