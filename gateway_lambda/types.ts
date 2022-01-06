export enum EVENT {
  USER_DELETE = 'user_delete',
  PROFILE_UPDATE = 'profile_update',
}

export type SqsEvent = {
  user_id: string;
  event: EVENT;
  timestamp: number;
};

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
