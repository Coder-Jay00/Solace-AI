import assert from 'assert';

// Simulated environment scenarios

// Scenario 1: Expo Go on local Wi-Fi with hostUri
const expoGoWifiConstants = {
  appOwnership: 'expo',
  executionEnvironment: 'storeClient',
  expoGoConfig: { developer: 'admin' },
  expoConfig: {
    hostUri: '192.168.1.42:8081',
  },
  linkingUri: 'exp://192.168.1.42:8081',
};

// Scenario 2: Expo Go with linkingUri only
const expoGoLinkingConstants = {
  appOwnership: 'expo',
  executionEnvironment: 'storeClient',
  expoGoConfig: {},
  expoConfig: {},
  linkingUri: 'exp://10.0.0.5:8081/--/some-initial-path',
};

// Scenario 3: Standalone Android APK (EAS Build / production)
const standaloneConstants = {
  appOwnership: null,
  executionEnvironment: 'standalone',
  expoGoConfig: null,
  expoConfig: {
    android: {
      package: 'com.solaceai.app',
    },
  },
  linkingUri: 'solaceai://',
};

function resolveUriWithMock(Constants) {
  const isExpoGo =
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === 'storeClient' ||
    Boolean(Constants.expoGoConfig) ||
    Boolean(Constants.linkingUri?.startsWith('exp://') || Constants.linkingUri?.startsWith('exps://'));

  if (isExpoGo) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      return `exp://${hostUri}/--/auth/callback`;
    }

    const linkingUri = Constants.linkingUri;
    if (linkingUri && (linkingUri.startsWith('exp://') || linkingUri.startsWith('exps://'))) {
      const cleanBase = linkingUri.replace(/\/--\/.*$/, '').replace(/\/$/, '');
      return `${cleanBase}/--/auth/callback`;
    }

    return 'exp://localhost:8081/--/auth/callback';
  }

  return 'solaceai://auth/callback';
}

console.log('--- Testing OAuth Redirect URI Logic ---');

const uri1 = resolveUriWithMock(expoGoWifiConstants);
console.log('Scenario 1 (Expo Go Wi-Fi):', uri1);
assert.strictEqual(uri1, 'exp://192.168.1.42:8081/--/auth/callback');

const uri2 = resolveUriWithMock(expoGoLinkingConstants);
console.log('Scenario 2 (Expo Go linkingUri):', uri2);
assert.strictEqual(uri2, 'exp://10.0.0.5:8081/--/auth/callback');

const uri3 = resolveUriWithMock(standaloneConstants);
console.log('Scenario 3 (Standalone APK):', uri3);
assert.strictEqual(uri3, 'solaceai://auth/callback');

console.log('\n✅ All URI generation scenarios passed perfectly!\n');

