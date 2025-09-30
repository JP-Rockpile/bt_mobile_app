import { z } from 'zod';

// Authentication Schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  picture: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number(),
  idToken: z.string().optional(),
});

// Chat Schemas
export const chatMessageSchema = z.object({
  id: z.string().uuid(),
  chatId: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.string().datetime(),
  metadata: z
    .object({
      betRecommendation: z.any().optional(),
      error: z.string().optional(),
      tokensUsed: z.number().optional(),
    })
    .optional(),
});

export const chatThreadSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastMessageAt: z.string().datetime().optional(),
  messageCount: z.number().int().nonnegative(),
});

// Betting Schemas
export const betRecommendationSchema = z.object({
  id: z.string().uuid(),
  sport: z.string(),
  league: z.string(),
  event: z.string(),
  eventDate: z.string().datetime(),
  betType: z.string(),
  selection: z.string(),
  odds: z.number().positive(),
  oddsFormat: z.enum(['decimal', 'american', 'fractional']),
  stake: z.number().positive(),
  potentialPayout: z.number().positive(),
  sportsbook: z.object({
    id: z.string(),
    name: z.string(),
    deepLinkScheme: z.string(),
    deepLinkPath: z.string().optional(),
    appStoreUrl: z.string().url().optional(),
    playStoreUrl: z.string().url().optional(),
  }),
  reasoning: z.string().optional(),
  confidence: z.number().min(0).max(100).optional(),
});

// Notification Schemas
export const pushNotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  body: z.string(),
  data: z.record(z.string()).optional(),
  type: z.enum(['bet_result', 'bet_reminder', 'chat_message', 'system_alert']),
  sentAt: z.string().datetime(),
});

export const deviceTokenSchema = z.object({
  userId: z.string().uuid(),
  token: z.string(),
  platform: z.enum(['ios', 'android']),
  deviceId: z.string(),
  createdAt: z.string().datetime(),
});

// API Response Schemas
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.record(z.unknown()).optional(),
        statusCode: z.number(),
      })
      .optional(),
    timestamp: z.string().datetime(),
  });

// Validation Helpers
export const validateOrThrow = <T>(schema: z.ZodType<T>, data: unknown): T => {
  return schema.parse(data);
};

export const validateSafe = <T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};
