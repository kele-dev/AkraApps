import type { Notification } from '../types';

export interface NotificationDraftInput {
  recipientUserId: string;
  actor: {
    id: string;
    displayName: string;
    avatar: string;
  };
  type: Notification['type'];
  message: string;
  postId?: string;
  bookTitle?: string;
  id?: string;
}

/** Build a Notification for another user; returns null when actor targets self or invalid recipient. */
export const createNotificationRecord = ({
  recipientUserId,
  actor,
  type,
  message,
  postId,
  bookTitle,
  id,
}: NotificationDraftInput): Notification | null => {
  if (!recipientUserId || !actor.id || actor.id === 'guest' || recipientUserId === actor.id) {
    return null;
  }

  return {
    id: id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId: recipientUserId,
    fromUserId: actor.id,
    fromUserDisplayName: actor.displayName,
    fromUserAvatar: actor.avatar,
    type,
    message,
    postId,
    bookTitle,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
};
