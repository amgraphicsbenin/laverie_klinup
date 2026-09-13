const fs = require('fs');
const path = require('path');
const buildDir = path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build');

// ─── Patch 1: warnOfExpoGoPushUsage.js ─────────────────────────────────────────
// Converts throw Error / console.warn to console.log so app doesn't trigger LogBox warnings on Expo Go Android
const warnFile = path.join(buildDir, 'warnOfExpoGoPushUsage.js');
if (fs.existsSync(warnFile)) {
  let content = fs.readFileSync(warnFile, 'utf8');
  if (content.includes('throw new Error(message);')) {
    content = content.replace('throw new Error(message);', 'didWarn = true; console.log(message);');
    fs.writeFileSync(warnFile, content, 'utf8');
    console.log('[patch] warnOfExpoGoPushUsage.js patched (throw => log)');
  } else if (content.includes('console.warn(message);')) {
    content = content.replaceAll('console.warn(message);', 'console.log(message);');
    fs.writeFileSync(warnFile, content, 'utf8');
    console.log('[patch] warnOfExpoGoPushUsage.js patched (warn => log)');
  } else {
    console.log('[patch] warnOfExpoGoPushUsage.js already patched');
  }
}

// ─── Patch 2: TopicSubscriptionModule.android.js ───────────────────────────────
// ExpoTopicSubscriptionModule does not exist in Expo Go SDK 53+ (Android)
const topicFile = path.join(buildDir, 'TopicSubscriptionModule.android.js');
if (fs.existsSync(topicFile)) {
  const content = fs.readFileSync(topicFile, 'utf8');
  if (content.includes("requireNativeModule('ExpoTopicSubscriptionModule')") && !content.includes('isRunningInExpoGo')) {
    const patched = [
      '// Patched for Expo Go compatibility (SDK 53+)',
      '// ExpoTopicSubscriptionModule is not available in Expo Go',
      'let _module;',
      'try {',
      "  const { requireNativeModule } = require('expo-modules-core');",
      "  const { isRunningInExpoGo } = require('expo');",
      "  if (!isRunningInExpoGo()) { _module = requireNativeModule('ExpoTopicSubscriptionModule'); }",
      '} catch (_e) {}',
      'export default _module || {',
      '  addListener: () => {},',
      '  removeListeners: () => {},',
      '  subscribeToTopicAsync: () => Promise.resolve(null),',
      '  unsubscribeFromTopicAsync: () => Promise.resolve(null),',
      '};',
      '//# sourceMappingURL=TopicSubscriptionModule.android.js.map',
    ].join('\n');
    fs.writeFileSync(topicFile, patched, 'utf8');
    console.log('[patch] TopicSubscriptionModule.android.js patched (mock for Expo Go)');
  } else {
    console.log('[patch] TopicSubscriptionModule.android.js already patched');
  }
}

console.log('[patch] expo-notifications patch complete.');