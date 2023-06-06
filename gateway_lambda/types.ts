export enum EVENT {
  USER_DELETE = 'user_delete',
  PROFILE_UPDATE = 'profile_update',

  APPLE_MIGRATION = 'apple_migration',
}

/**
 * event triggered by fxa for migrating apple users
 * from pocket sso auth to fxa auth.
 */
export type AppleMigrationSqsEvent = {
  fxa_user_id: string;
  event: EVENT.APPLE_MIGRATION;
  user_email: string;
  transfer_sub: string;
  timestamp: number;
};

export type UserDeleteSqsEvent = {
  user_id: string;
  event: EVENT.USER_DELETE;
  timestamp: number;
};

/**
 * This event type might contain an user email property in the payload
 * indicating a email updated event. See FxA Event Payload below.
 */
export type ProfileUpdatedSqsEvent = {
  user_id: string;
  event: EVENT.PROFILE_UPDATE;
  timestamp: number;
  user_email?: string;
};

export type SqsEvent =
  | UserDeleteSqsEvent
  | ProfileUpdatedSqsEvent
  | AppleMigrationSqsEvent;

/**
 * FxA Event Payload
 * Example profile change event:
 *   "https://schemas.accounts.firefox.com/event/profile-change": {
 *      "email": "example@mozilla.com"
 *   }
 * Example delete profile event:
 *  "https://schemas.accounts.firefox.com/event/delete-user": {}
 */
type FxaEvent = {
  [key: string]: Record<string, any>;
};
export type FxaPayload = {
  sub: string;
  events: FxaEvent;
};
