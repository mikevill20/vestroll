import { db } from "../db";
import { auditLogs, auditEventEnum } from "../db/schema";

export type AuditEvent = (typeof auditEventEnum.enumValues)[number];

export class AuditLogService {
  static async logEvent(data: {
    userId: string;
    event: AuditEvent;
    oldValue?: string;
    newValue?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await db.insert(auditLogs).values({
      userId: data.userId,
      event: data.event,
      oldValue: data.oldValue || null,
      newValue: data.newValue || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
    });
  }

  static async logRoleChange(data: {
    userId: string;
    oldRole: string;
    newRole: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await this.logEvent({
      userId: data.userId,
      event: "ROLE_CHANGE",
      oldValue: data.oldRole,
      newValue: data.newRole,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  }

  static async logEmailChange(data: {
    userId: string;
    oldEmail: string;
    newEmail: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await this.logEvent({
      userId: data.userId,
      event: "EMAIL_CHANGE",
      oldValue: data.oldEmail,
      newValue: data.newEmail,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  }

  static async logBiometricEnrollment(data: {
    userId: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await this.logEvent({
      userId: data.userId,
      event: "BIOMETRIC_ENROLLMENT",
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  }
}
