# @betthink/shared Package Update Requirements

## Context

The BetThink mobile application currently uses a local `packages/shared` directory for type definitions, schemas, and utility functions. We need to migrate to using the published `@betthink/shared` NPM package (currently at v0.1.0) to maintain consistency across all BetThink repositories including the mobile app, API server, and model/AI repositories. However, the current published version is missing several critical types, schemas, and utilities that the mobile application depends on. This document outlines the required additions to ensure backwards compatibility and enable a smooth migration.

## Important Considerations

The `@betthink/shared` package is used across multiple repositories including the API backend and AI model services. Any changes must be additive and non-breaking to avoid disrupting existing integrations. We are adding mobile-specific types and utilities that will also benefit the other repositories. All new types should follow the existing patterns and conventions already established in the package, including proper TypeScript typing, Zod schema validation, and comprehensive JSDoc documentation.

## Required Type Additions

The package needs to export the following types that are currently missing but required by the mobile application. These types represent the core domain model for the mobile chat and betting experience:

### Chat and Messaging Types

We need a `ChatMessage` interface that represents an individual message in a conversation thread. This should include an id field (UUID string), a chatId field referencing the parent conversation (UUID string), a role field that can be "user", "assistant", or "system", the actual message content as a string, a timestamp in ISO 8601 datetime format, and an optional metadata object. The metadata object should support embedding a bet recommendation directly in the message, capturing any error messages that occurred during message processing, and tracking token usage for LLM calls. Additionally, we need a `LocalChatMessage` interface that extends ChatMessage to support offline-first functionality in the mobile app, adding a localId field for client-side identification, a synced boolean flag to track synchronization status with the server, and an optional optimistic boolean flag for optimistic UI updates.

We also need a `Conversation` interface (this may conflict with your existing Conversation type, so please create an alias or extend appropriately) that represents a chat conversation thread. It should include an id (UUID), userId (UUID) for the conversation owner, a title string, createdAt and updatedAt timestamps, an optional lastMessageAt timestamp, a messageCount integer tracking the number of messages, and an optional metadata field as a flexible Record object that can be null. To support paginated conversation listing, we need a `ConversationListResponse` interface containing an array of conversations, a total count, the current page number, and the pageSize. For backwards compatibility, please create type aliases where `ChatThread = Conversation` and `ChatHistoryResponse = ConversationListResponse`.

### Server-Sent Events (SSE) Types

The mobile app uses SSE for real-time streaming of AI responses. We need an `SSEEvent` interface representing the raw SSE event structure with an event name string, data payload string, optional id string, and optional retry number for reconnection timing. We also need a `StreamChunk` interface for parsed streaming data that includes a type discriminator that can be "content", "metadata", "error", or "done", an optional content string for text chunks, optional metadata object matching the MessageMetadata structure, and an optional error string for error chunks.

For typed SSE events specific to chat streaming, we need a `ChatSSEEventType` union type covering "connected", "heartbeat", "llm_chunk", "llm_complete", "system", and "error" event types. We need a base interface `BaseChatSSEEvent` with type and timestamp fields, and then specific event interfaces: `ConnectedEvent` for initial connection confirmation, `HeartbeatEvent` for keep-alive messages, `LLMChunkEvent` containing incremental content strings, `LLMCompleteEvent` containing the final complete content, `SystemEvent` for system messages with an optional metadata record, and `ErrorEvent` for error conditions with message and optional error details. Finally, create a discriminated union type `ChatSSEEvent` that covers all these event types.

### Notification and Device Types

For push notification support, we need a `PushNotification` interface with id (UUID), userId (UUID), title and body strings, optional data record for custom payload, a type field using the NotificationType enum, and a sentAt timestamp. The `NotificationType` should be a union type supporting "bet_result", "bet_reminder", "chat_message", and "system_alert". We also need a `DeviceToken` interface for managing push notification tokens, including userId (UUID), the token string itself, a platform enum of "ios" or "android", deviceId string, and createdAt timestamp.

### API Response and Error Types

We need standardized API response types. The `ApiResponse` interface should be a generic type with a success boolean, optional data field of generic type T, optional error object of type ApiError, and a timestamp string. The `ApiError` interface should include a code string for error categorization, a human-readable message string, optional details as a flexible Record object, and a statusCode number for the HTTP status. We also need a `PaginationParams` interface with optional page number, optional pageSize number, optional sortBy string field name, and optional sortOrder enum of "asc" or "desc".

### Analytics Types

For tracking user behavior, we need an `AnalyticsEvent` interface with a name string, optional properties Record, numeric timestamp, optional userId string, and optional sessionId string. We also need an `EventName` type covering common analytics events including "app_opened", "session_started", "chat_message_sent", "chat_message_received", "bet_recommendation_shown", "bet_confirmed", "bet_cancelled", "sportsbook_redirect", "notification_received", "notification_opened", "error_occurred", "sse_connection_established", "sse_connection_failed", and "sse_reconnection_attempted".

### Synchronization Types

For offline-first data synchronization, we need a `SyncStatus` interface containing an optional lastSyncAt timestamp, a pendingChanges count, an isSyncing boolean flag, and an optional syncError string message.

## Required Utility Function Additions

The following utility functions need to be added or exposed at the top level of the package exports:

### Date and Time Utilities

A `formatRelativeTime` function that takes a date (string or Date object) and returns a human-readable relative time string like "just now", "5m ago", "3h ago", "2d ago", or falls back to a formatted date string for older dates. The implementation should handle seconds (less than 60 shows "just now"), minutes (less than 60 shows "Xm ago"), hours (less than 24 shows "Xh ago"), days (less than 7 shows "Xd ago"), and anything older should use toLocaleDateString formatting.

### Odds Utilities

A `convertOdds` function that converts between decimal, american, and fractional odds formats, taking the odds value as a number, the source format, and target format as parameters. The function should convert through decimal as an intermediate format and return a properly rounded number. We also need a `calculatePayout` function that calculates potential payout given a stake amount, odds value, and odds format string, returning the total payout amount rounded to two decimal places.

### String Utilities

A `truncate` function that truncates a string to a maximum length, adding ellipsis ("...") if truncated, and a `capitalize` function that capitalizes the first character of a string.

### Validation Utilities

An `isValidEmail` function using a standard email regex pattern, and an `isValidUUID` function using the UUID v4 regex pattern, both returning boolean values.

### Retry and Async Utilities

A `sleep` function that returns a Promise resolving after the specified milliseconds, useful for delays and retry logic. An `exponentialBackoff` function that calculates backoff delay in milliseconds based on attempt number, using a base delay (default 1000ms) and capping at 30 seconds maximum delay.

### Deep Linking Utilities

A `buildDeepLink` function that constructs deep links for sportsbook redirects, taking a URL scheme string, path string, and optional params object, properly encoding query parameters and returning the complete deep link URL string.

### Error Handling Utilities

A `sanitizeError` function that safely extracts error information from unknown error types, handling Error instances, string errors, and unknown types, returning an object with a message string and optional code string.

### Platform Detection Utilities

An `isIOS` function that detects iOS devices by checking the user agent, and an `isAndroid` function for Android detection, both returning boolean values and safely handling undefined navigator objects.

## Required Zod Schema Additions

For each of the types listed above, corresponding Zod schemas need to be created and exported. These should follow the existing schema patterns in the package:

The `chatMessageSchema` should validate UUID strings for id and chatId fields, enum for role, string content, datetime string for timestamp, and an optional nested object for metadata containing optional betRecommendation (z.any() for now), optional error string, and optional tokensUsed number. The `chatThreadSchema` should validate all fields as described in the Conversation interface. Create `conversationSchema` as an alias to chatThreadSchema if needed for consistency.

The `sseEventSchema`, `streamChunkSchema`, and all `ChatSSEEvent` variant schemas need to be created with proper discriminated union validation. The `pushNotificationSchema` and `deviceTokenSchema` should validate all respective fields including proper enum validation for type and platform fields. The `apiResponseSchema` should be a schema factory function that takes a data schema as a parameter and returns a composed schema, similar to existing patterns in the package.

All other types listed above should have corresponding schemas following the same validation patterns, using appropriate Zod validators like `z.string().uuid()`, `z.string().datetime()`, `z.string().email()`, `z.enum()`, `z.number().int().nonnegative()`, `z.record()`, etc. Also ensure the existing validation helper functions `validateOrThrow` and `validateSafe` are exported if they aren't already.

## Export Structure Requirements

All new types should be exported from the main package entry point (`@betthink/shared`). Types should be exported from a types module that can also be imported via subpath (`@betthink/shared/types`). Schemas should be exported from a schemas module (`@betthink/shared/schemas`). Utility functions should be exported from a utils module (`@betthink/shared/utils`). Ensure all exports are properly typed with TypeScript declaration files and that tree-shaking is supported through proper module configuration.

## Migration Path and Backwards Compatibility

When adding these new types and utilities, please ensure they do not conflict with or break any existing exports in version 0.1.0. If there are naming conflicts (like with Conversation type), please use appropriate namespacing or create compatibility aliases. The package should support both CommonJS and ESM imports. All new code should include comprehensive JSDoc comments for API documentation. Consider this as a minor version bump to 0.2.0 given the additive nature of these changes.

## Testing Requirements

After implementing these changes, the package should be publishable to the GitHub npm registry and consumable by the mobile app with the alias `@betthink/shared@npm:@jp-rockpile/shared@^0.2.0`. All types should pass TypeScript strict mode compilation. All schemas should include test cases validating both successful parsing and expected validation failures. Utility functions should have unit tests covering common use cases and edge cases.

## Summary

Please add all the types, interfaces, schemas, and utility functions described above to the `@betthink/shared` package, ensuring they are properly exported at the top level and through subpath exports. Maintain backwards compatibility with existing exports, follow established code patterns and conventions, include comprehensive TypeScript types and JSDoc comments, and prepare for publishing as version 0.2.0. This will enable the BetThink mobile application to fully migrate from its local shared package to the centralized npm package while maintaining all required functionality.

