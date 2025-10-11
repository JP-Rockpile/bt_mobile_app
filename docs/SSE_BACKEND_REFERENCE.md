# SSE Backend Reference Implementation (NestJS)

## Overview

This document provides a reference implementation for the Server-Sent Events (SSE) endpoint in NestJS that works with the `useChatSSE` hook.

## Complete NestJS Implementation

### 1. Controller

```typescript
// src/chat/chat.controller.ts
import {
  Controller,
  Get,
  Param,
  Sse,
  Query,
  UseGuards,
  MessageEvent,
} from '@nestjs/common';
import { Observable, interval, from, concat } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import { LLMService } from '../llm/llm.service';

@Controller('api/v1/chat/conversations')
export class ChatConversationsController {
  constructor(
    private readonly chatService: ChatService,
    private readonly llmService: LLMService,
  ) {}

  @Get(':conversationId/stream')
  @Sse()
  @UseGuards(JwtAuthGuard)
  streamConversation(
    @Param('conversationId') conversationId: string,
    @Query('access_token') accessToken?: string, // Support query param auth
  ): Observable<MessageEvent> {
    // If using query param auth, validate the token here
    if (accessToken) {
      // Validate token manually
      // this.authService.validateToken(accessToken);
    }

    return this.createSSEStream(conversationId);
  }

  private createSSEStream(conversationId: string): Observable<MessageEvent> {
    // Send connected event
    const connectedEvent = from([
      this.createEvent('connected', {}),
    ]);

    // Send heartbeat every 30 seconds
    const heartbeatEvents = interval(30000).pipe(
      map(() => this.createEvent('heartbeat', {})),
    );

    // Get the latest message and stream response
    const messageStream = from(
      this.chatService.getLatestMessage(conversationId),
    ).pipe(
      switchMap((message) =>
        this.streamLLMResponse(conversationId, message),
      ),
    );

    // Combine all streams
    return concat(connectedEvent, messageStream);
  }

  private async *streamLLMResponse(
    conversationId: string,
    userMessage: string,
  ): AsyncGenerator<MessageEvent> {
    try {
      let fullContent = '';

      // Stream chunks from LLM
      const stream = await this.llmService.streamCompletion(userMessage);

      for await (const chunk of stream) {
        if (chunk.content) {
          fullContent += chunk.content;

          // Send chunk event
          yield this.createEvent('llm_chunk', {
            content: chunk.content,
          });
        }
      }

      // Send completion event
      yield this.createEvent('llm_complete', {
        content: fullContent,
      });

      // Save to database
      await this.chatService.saveMessage(conversationId, {
        role: 'assistant',
        content: fullContent,
      });

      // Check for bet recommendations and send system event if found
      const betRecommendation = await this.chatService.extractBetRecommendation(
        fullContent,
      );

      if (betRecommendation) {
        yield this.createEvent('system', {
          message: 'New bet recommendation available',
          metadata: {
            betId: betRecommendation.id,
            odds: betRecommendation.odds,
          },
        });
      }
    } catch (error) {
      // Send error event
      yield this.createEvent('error', {
        message: 'Failed to generate response',
        error: error.message,
      });
    }
  }

  private createEvent(
    type: string,
    data: Record<string, any>,
  ): MessageEvent {
    return {
      data: JSON.stringify({
        type,
        timestamp: new Date().toISOString(),
        ...data,
      }),
    };
  }
}
```

### 2. Service

```typescript
// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Conversation } from './entities/conversation.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
  ) {}

  async getLatestMessage(conversationId: string): Promise<string> {
    const message = await this.messageRepository.findOne({
      where: {
        conversationId,
        role: 'user',
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return message?.content || '';
  }

  async saveMessage(
    conversationId: string,
    data: { role: string; content: string },
  ): Promise<Message> {
    const message = this.messageRepository.create({
      conversationId,
      ...data,
      timestamp: new Date(),
    });

    return this.messageRepository.save(message);
  }

  async extractBetRecommendation(
    content: string,
  ): Promise<any | null> {
    // Implement your bet recommendation extraction logic
    // This is just a placeholder
    if (content.includes('bet') || content.includes('odds')) {
      return {
        id: 'bet-' + Date.now(),
        odds: 2.5,
      };
    }
    return null;
  }
}
```

### 3. LLM Service (OpenAI Example)

```typescript
// src/llm/llm.service.ts
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LLMService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async *streamCompletion(
    userMessage: string,
  ): AsyncGenerator<{ content: string }> {
    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful sports betting assistant.',
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield { content };
      }
    }
  }
}
```

### 4. Auth Guard (Query Param Support)

```typescript
// src/auth/jwt-auth.guard.ts
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // Check for query parameter token
    const queryToken = request.query.access_token;
    if (queryToken) {
      // Move token to header for passport to process
      request.headers.authorization = `Bearer ${queryToken}`;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
```

### 5. Module

```typescript
// src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatConversationsController } from './chat.controller';
import { ChatService } from './chat.service';
import { LLMService } from '../llm/llm.service';
import { Message } from './entities/message.entity';
import { Conversation } from './entities/conversation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Conversation])],
  controllers: [ChatConversationsController],
  providers: [ChatService, LLMService],
})
export class ChatModule {}
```

## Alternative: Express-style Response

If you prefer using Express response object:

```typescript
@Get(':conversationId/stream')
@UseGuards(JwtAuthGuard)
async streamConversation(
  @Param('conversationId') conversationId: string,
  @Res() response: Response,
) {
  // Set SSE headers
  response.setHeader('Content-Type', 'text/event-stream');
  response.setHeader('Cache-Control', 'no-cache');
  response.setHeader('Connection', 'keep-alive');
  response.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send connected event
  response.write(
    `data: ${JSON.stringify({
      type: 'connected',
      timestamp: new Date().toISOString(),
    })}\n\n`
  );

  // Heartbeat interval
  const heartbeatInterval = setInterval(() => {
    response.write(
      `data: ${JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
      })}\n\n`
    );
  }, 30000);

  try {
    // Get user message
    const userMessage = await this.chatService.getLatestMessage(conversationId);
    
    // Stream LLM response
    const stream = await this.llmService.streamCompletion(userMessage);
    let fullContent = '';

    for await (const chunk of stream) {
      if (chunk.content) {
        fullContent += chunk.content;
        
        // Send chunk
        response.write(
          `data: ${JSON.stringify({
            type: 'llm_chunk',
            content: chunk.content,
            timestamp: new Date().toISOString(),
          })}\n\n`
        );
      }
    }

    // Send completion
    response.write(
      `data: ${JSON.stringify({
        type: 'llm_complete',
        content: fullContent,
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    // Save to database
    await this.chatService.saveMessage(conversationId, {
      role: 'assistant',
      content: fullContent,
    });
  } catch (error) {
    // Send error event
    response.write(
      `data: ${JSON.stringify({
        type: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      })}\n\n`
    );
  } finally {
    // Cleanup
    clearInterval(heartbeatInterval);
    response.end();
  }
}
```

## CORS Configuration

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for SSE
  app.enableCors({
    origin: ['http://localhost:19006', 'exp://192.168.1.100:8081'], // Expo URLs
    credentials: true,
    exposedHeaders: ['Content-Type', 'Cache-Control', 'Connection'],
  });

  await app.listen(3000);
}
bootstrap();
```

## Testing the Endpoint

### Using curl:

```bash
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/chat/conversations/123/stream
```

### Using Node.js:

```javascript
const EventSource = require('eventsource');

const es = new EventSource(
  'http://localhost:3000/api/v1/chat/conversations/123/stream?access_token=YOUR_TOKEN'
);

es.onmessage = (event) => {
  console.log('Event:', JSON.parse(event.data));
};

es.onerror = (error) => {
  console.error('Error:', error);
};
```

## Deployment Considerations

### Nginx Configuration

If using Nginx as a reverse proxy:

```nginx
location /api/v1/chat/conversations/ {
    proxy_pass http://backend:3000;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
    proxy_set_header X-Accel-Buffering no;
    proxy_buffering off;
    proxy_cache off;
    chunked_transfer_encoding off;
}
```

### Environment Variables

```env
# .env
OPENAI_API_KEY=sk-...
JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql://...
```

## Performance Tips

1. **Connection Limits**: Limit concurrent SSE connections per user
2. **Timeouts**: Implement connection timeouts (e.g., 5 minutes)
3. **Rate Limiting**: Rate limit SSE endpoint to prevent abuse
4. **Monitoring**: Monitor open connections and response times
5. **Error Handling**: Always send error events instead of closing connection

## Security Considerations

1. **Authentication**: Always validate JWT token
2. **Authorization**: Verify user has access to conversation
3. **Rate Limiting**: Prevent connection spam
4. **Input Validation**: Validate conversationId parameter
5. **Error Messages**: Don't leak sensitive information in errors

## Common Issues

**Issue**: Connection drops after 60 seconds
- **Solution**: Ensure heartbeat events are sent

**Issue**: High memory usage
- **Solution**: Implement connection limits and timeouts

**Issue**: Nginx buffering responses
- **Solution**: Set `X-Accel-Buffering: no` header

**Issue**: CORS errors
- **Solution**: Configure CORS properly for SSE

## References

- [MDN: Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [NestJS SSE Documentation](https://docs.nestjs.com/techniques/server-sent-events)
- [OpenAI Streaming](https://platform.openai.com/docs/api-reference/streaming)

