import { Platform, Dimensions, StatusBar as RNStatusBar, useWindowDimensions } from 'react-native';

/**
 * Returns the correct bottom padding to add to a ScrollView's
 * contentContainerStyle so content is never hidden behind the tab bar
 * or the Android gesture / 3-button navigation bar.
 *
 * Tab bar visible height breakdown (Android):
 *   54dp  — icons + labels area
 *   0-48dp — navigation bar (gesture pill ≈ 0, 3-button bar ≈ 48)
 *
 * We add a small extra buffer so the last card is never flush against the tab bar.
 */
export function useScrollPaddingBottom() {
  const { height: windowH } = useWindowDimensions();
  const screenH = Dimensions.get('screen').height;

  if (Platform.OS === 'ios') {
    // iOS handles safe area via SafeAreaView; 106 = tab bar height incl. home indicator + 12 buffer
    return 118;
  }

  if (Platform.OS === 'android') {
    const statusBarH = RNStatusBar.currentHeight || 0;
    const navBarH = Math.max(0, screenH - windowH - statusBarH);
    // tab icons + vertical padding (82) + nav bar + 12 buffer
    return 82 + navBarH + 12;
  }

  // Web: tab bar is absolutely positioned (approx 82px) + buffer
  return 98;
}

/**
 * Returns the total height the tab bar occupies at the bottom of the screen,
 * useful for absolutely-positioned elements that need to sit above the tab bar.
 */
export function useTabBarHeight() {
  const { height: windowH } = useWindowDimensions();
  const screenH = Dimensions.get('screen').height;

  if (Platform.OS === 'ios') return 106;

  if (Platform.OS === 'android') {
    const statusBarH = RNStatusBar.currentHeight || 0;
    const navBarH = Math.max(0, screenH - windowH - statusBarH);
    return 82 + navBarH;
  }

  return 82; // web fallback
}
