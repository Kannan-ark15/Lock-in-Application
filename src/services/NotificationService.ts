import * as Notifications from 'expo-notifications';

import type { Result } from '@/types/result.types';
import { err, ok } from '@/types/result.types';

export interface NotificationServiceError {
  code: 'PERMISSION_DENIED' | 'SCHEDULE_ERROR' | 'CANCEL_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  cause?: unknown;
}

let dailyReminderId: string | null = null;
let permissionChecked = false;

const ensurePermission = async (): Promise<Result<void, NotificationServiceError>> => {
  try {
    if (!permissionChecked) {
      const existingPermissions = await Notifications.getPermissionsAsync();
      if (!existingPermissions.granted) {
        const requestedPermissions = await Notifications.requestPermissionsAsync();
        if (!requestedPermissions.granted) {
          return err({
            code: 'PERMISSION_DENIED',
            message: 'Notification permission was denied by the user.',
          });
        }
      }

      permissionChecked = true;
    }

    return ok(undefined);
  } catch (cause) {
    return err({
      code: 'UNKNOWN_ERROR',
      message: 'Failed while requesting notification permissions.',
      cause,
    });
  }
};

export const NotificationService = {
  async scheduleDailyReminder(time: Date): Promise<Result<string, NotificationServiceError>> {
    const permissionResult = await ensurePermission();
    if (!permissionResult.ok) {
      return permissionResult;
    }

    try {
      if (dailyReminderId) {
        await Notifications.cancelScheduledNotificationAsync(dailyReminderId);
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'LockIn Reminder',
          body: 'Your daily tasks are waiting. Complete them to keep your streak alive.',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: time.getHours(),
          minute: time.getMinutes(),
        },
      });

      dailyReminderId = id;
      return ok(id);
    } catch (cause) {
      return err({
        code: 'SCHEDULE_ERROR',
        message: 'Failed to schedule daily reminder notification.',
        cause,
      });
    }
  },

  async cancelReminder(): Promise<Result<void, NotificationServiceError>> {
    try {
      if (dailyReminderId) {
        await Notifications.cancelScheduledNotificationAsync(dailyReminderId);
        dailyReminderId = null;
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }

      return ok(undefined);
    } catch (cause) {
      return err({
        code: 'CANCEL_ERROR',
        message: 'Failed to cancel reminder notification.',
        cause,
      });
    }
  },
};
