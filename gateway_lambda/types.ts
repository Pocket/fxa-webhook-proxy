export enum EVENT {
  USER_DELETE = 'user_delete',
  PROFILE_UPDATE = 'profile_update',
}

export type SqsEvent = {
  user_id: string;
  event: EVENT;
  timestamp: number;
};
