export type AdminUserRow = { id:string; name:string; username:string; positionCode:string|null; systemRole:string|null; role:string; isActive:boolean|null; mustChangePassword:boolean|null; assignments:string[]; createdAt:string|Date|number; updatedAt:string|Date|number };
export type CredentialRow = { id:string; name:string; username:string; position:string; temporaryPassword:string; status:string };
export type AuditRow = { id:string; adminUserId:string; actionType:string; targetType:string; targetId:string; metadata:string; createdAt:string|Date|number };
export const dateText = (value: string|Date|number) => new Date(value).toLocaleString();
