import * as Haptics from 'expo-haptics';

export async function selectionHaptic() {
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    console.warn('Selection haptic feedback is unavailable:', error);
  }
}

export async function successHaptic() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.warn('Success haptic feedback is unavailable:', error);
  }
}

export async function warningHaptic() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    console.warn('Warning haptic feedback is unavailable:', error);
  }
}
