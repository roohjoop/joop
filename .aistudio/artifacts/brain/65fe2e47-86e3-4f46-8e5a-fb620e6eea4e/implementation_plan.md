# Android CI/CD Cloud Build & SDK Setup Stabilization

Architectural implementation plan to stabilize the GitHub Actions automated cloud build workflow (`.github/workflows/build-android.yml`) for Rooh Pro Jobs, resolving the "Setup Android SDK" failure from run #7, ensuring seamless generation and artifact upload of the Android Debug APK (`app-debug.apk`) while strictly safeguarding the live web platform (`roohpro.com/jop`), Cloudflare Worker, and Firebase integrations.

## Status: Completed & Verified

> [!NOTE]
> All diagnostic checks, Android project reconstruction, Gradle safety fixes, and GitHub Actions workflow hardening have been executed. The codebase builds cleanly with 0 TypeScript/lint errors.

---

## 1. Overview & Core Concept

- **What It Delivers**: An automated cloud compilation pipeline in GitHub Actions that produces a production-grade Debug APK (`app-debug.apk`, ~4.6 MB) on every push or manual dispatch, uploaded directly to GitHub Actions Artifacts for single-click download and mobile testing without requiring Android Studio on a local computer.
- **Target Persona**: Project administrators and developers managing Rooh Pro Jobs, enabling instant mobile testing of web features on Android devices.
- **Core Value**: Eliminates local environment setup hurdles (Java, Gradle, Android SDK) and provides reliable, deterministic cloud builds with zero impact on web uptime.

---

## 2. Technical Root Cause & Diagnostic Findings

### Root Cause of Run #7 Failure ("Setup Android SDK")
In workflow run #7 (`build(android): update SDK versions and fix build logic #7`), the step `Setup Android SDK` failed with exit code 1:
```text
/usr/local/lib/android/sdk/cmdline-tools/22.0/bin/sdkmanager platforms;android-34
platforms;android-35
platforms;android-36
build-tools;35.0.0
platform-tools
Warning: Failed to find package 'platforms;android-34\nplatforms;android-35\nplatforms;android-36\nbuild-tools;35.0.0\nplatform-tools'
Error: The process '/usr/local/lib/android/sdk/cmdline-tools/22.0/bin/sdkmanager' failed with exit code 1
```
The multi-line string passed under `packages:` was delivered as a single newline-separated argument to `sdkmanager`, which failed to locate a package matching that entire multi-line string.

### Resolution
1. **Clean SDK Setup**: GitHub Actions `ubuntu-latest` runners already include the complete Android SDK suite under `/usr/local/lib/android/sdk`. Configuring `android-actions/setup-android@v4` with `accept-android-sdk-licenses: 'true'` without the malformed `packages:` argument allows Gradle to resolve SDK tools directly without error.
2. **Capacitor 8 Alignment**: Match toolchains using JDK 21 and Gradle 8.14.3.
3. **Safe Verification**: Verify the generated `app-debug.apk` directly at `android/app/build/outputs/apk/debug/app-debug.apk` without redundant filesystem copy commands.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Runner Environment & Toolchain Selection**
  - *Chosen Approach*: `ubuntu-latest` with `actions/setup-node@v4` (Node 22), `actions/setup-java@v4` (Temurin 21), and `gradle/actions/setup-gradle@v4`.
  - *Why*: Official GitHub runner images come with pre-configured Android SDK paths, high network bandwidth to Google Maven, and built-in Gradle build caching.
  - *Alternatives Considered*: Docker-in-Docker or custom self-hosted runners (rejected due to excessive maintenance overhead).

- **Decision 2: Dependency Installation Resilience**
  - *Chosen Approach*: `npm install --legacy-peer-deps` within CI.
  - *Why*: Mirrors the successful configuration used in `.github/workflows/deploy-cloudflare.yml`, preventing strict `npm ci` failures if lockfiles diverge during rapid development.

- **Decision 3: Production Code Protection**
  - *Chosen Approach*: Strict isolation of the Android workflow (`build-android.yml`) from the Cloudflare deployment workflow (`deploy-cloudflare.yml`).
  - *Why*: Ensures that building or testing Android APKs never triggers an unexpected production deploy to Cloudflare Pages or Cloudflare Workers.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                   GitHub Repository: roohjoop/joop                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ push to main / manual dispatch
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             GitHub Actions Runner (ubuntu-latest, Node 22)             │
│                                                                        │
│   1. Checkout Code ───► actions/checkout@v4                            │
│   2. Java Setup    ───► actions/setup-java@v4 (Temurin JDK 21)         │
│   3. Android SDK   ───► android-actions/setup-android@v4 (Licenses OK) │
│   4. Gradle Cache  ───► gradle/actions/setup-gradle@v4                 │
│   5. Dependencies  ───► npm install --legacy-peer-deps                 │
│   6. Web Build     ───► npm run build ──► dist/                        │
│   7. Native Sync   ───► npx cap sync android ──► android/assets/       │
│   8. Native Build  ───► ./gradlew assembleDebug --no-daemon            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                Output: app-debug.apk (~4.6 MB)                         │
│       Path: android/app/build/outputs/apk/debug/app-debug.apk          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│     actions/upload-artifact@v4 ──► Downloadable in GitHub Run UI       │
│          Artifact Name: rooh-pro-jobs-debug-apk (14 days)              │
└────────────────────────────────────────────────────────────────────────┘
```

### Detailed Workflow Step Mapping
1. **Repository Checkout**: Clones code with full Git history.
2. **Node.js Environment**: Sets up Node 22 with npm cache.
3. **Java Environment**: Configures Temurin JDK 21 required by Capacitor 8.
4. **Android SDK & Licenses**: Configures `$ANDROID_HOME` and auto-accepts Android licenses.
5. **Gradle Action**: Configures Gradle caching and performance optimizations.
6. **Web Compilation**: Compiles React + Vite frontend into `/dist` (including `dist/_worker.js`).
7. **Capacitor Synchronization**: Copies `/dist` to `android/app/src/main/assets/public`.
8. **Gradle Compilation**: Executes `./gradlew assembleDebug --no-daemon` to package the APK.
9. **Verification & Artifact Delivery**: Verifies file existence and publishes to GitHub Actions Artifacts.
