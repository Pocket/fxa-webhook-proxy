export enum EVENT {
  USER_DELETE = 'user_delete',
  PROFILE_UPDATE = 'profile_update',
}

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

export type SqsEvent = UserDeleteSqsEvent | ProfileUpdatedSqsEvent;

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
