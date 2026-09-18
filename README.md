# JP Connect 📱

**JP Connect** is a mobile application built with the Ionic Framework and React, utilizing Capacitor to provide seamless wireless peer-to-peer connectivity across devices without the need for an internet connection.

## 🎯 Main Objective and User Benefits

The primary goal of JP Connect is to facilitate secure, rapid, and fully offline data and file transfers between nearby mobile devices.

### Key Benefits
* **Offline Sharing**: Exchange files, contacts, and data even in areas without cellular coverage or Wi-Fi networks.
* **Rapid Discovery**: Instantly find nearby compatible devices through Bluetooth Low Energy (BLE).
* **Tap-to-Connect**: Seamlessly share contact details by simply tapping two NFC-enabled devices together.
* **Cross-Platform Readiness**: Built with Ionic, the application is fundamentally ready to be compiled to both Android and iOS devices from a single codebase.

## ✨ Key Features

1. **Dashboard & State Management**: A central hub to monitor and toggle the status of your connection protocols (Bluetooth LE, NFC).
2. **BLE Device Discovery**: Scan for nearby Bluetooth LE devices and initiate connections directly from the UI.
3. **NFC Tap & Share**: Instantly write and share contact NDEF records via NFC scanning and writing.
4. **Offline File Transfer Interface**: A dedicated, interactive UI for initiating and monitoring P2P Wi-Fi Direct file transfers (implementation via native streams).

## 🛠️ Platform and Tech Stack

This project was built to satisfy the university requirements for mobile architectures and cross-platform networking.

* **Frontend Framework**: [Ionic Framework](https://ionicframework.com/) (React)
* **Styling**: Tailwind CSS
* **Native Runtime**: [Capacitor](https://capacitorjs.com/)
* **Connectivity Plugins**: 
  * `@capacitor-community/bluetooth-le` (BLE Communication)
  * `@capgo/capacitor-nfc` (NFC Reading & Writing)

## 🚀 Setup and Development

### Prerequisites
* Node.js & npm
* Android Studio (for Android build)

### Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the local development server:
   ```bash
   npm run dev
   ```

3. Sync native Capacitor code:
   ```bash
   npx cap sync
   ```

4. Run on an Android device:
   ```bash
   npx cap run android
   ```

> **Note on Permissions:** When running on Android, the app will automatically request Location, Bluetooth, and NFC permissions. Ensure these are granted to test the scanning features properly.
