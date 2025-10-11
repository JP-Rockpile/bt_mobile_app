# SSE Data Flow Diagram

## Connection Lifecycle Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Component Mounts                            │
│                      (enabled = true)                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  useChatSSE()   │
                  │   Hook Init     │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Status:        │
                  │  "connecting"   │
                  └────────┬────────┘
                           │
                           ▼
          ┌────────────────────────────────┐
          │  Fetch SSE Endpoint:           │
          │  GET /api/v1/chat/             │
          │    conversations/:id/stream    │
          │  ?access_token=...             │
          └────────┬───────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   ┌─────────┐         ┌──────────┐
   │ Success │         │  Error   │
   └────┬────┘         └─────┬────┘
        │                    │
        │                    ▼
        │           ┌──────────────────┐
        │           │ handleError()    │
        │           │ Status:          │
        │           │ "disconnected"   │
        │           └────────┬─────────┘
        │                    │
        │                    ▼
        │           ┌──────────────────┐
        │           │ Schedule         │
        │           │ Reconnect        │
        │           │ (exponential     │
        │           │  backoff)        │
        │           └──────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Process Stream                                │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Read chunks → Decode → Parse SSE → Handle Events        │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Status:        │
                  │  "connected"    │
                  └────────┬────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Event Loop Active    │
              │   Receiving Events     │
              └────────────────────────┘
```

## Event Processing Flow

```
┌────────────────────────────────────────────────────────────────┐
│                      SSE Event Received                         │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  parseSSEEvent  │
                  │  (extract JSON) │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ handleSSEEvent  │
                  │  (switch type)  │
                  └────────┬────────┘
                           │
        ┌──────────────────┼──────────────────┬──────────────────┐
        │                  │                  │                  │
        ▼                  ▼                  ▼                  ▼
   ┌─────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
   │connected│      │heartbeat │      │llm_chunk │      │llm_com-  │
   │         │      │          │      │          │      │plete     │
   └────┬────┘      └─────┬────┘      └─────┬────┘      └────┬─────┘
        │                 │                  │                 │
        ▼                 ▼                  ▼                 ▼
   ┌─────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
   │Set      │      │No action │      │Append to │      │Move to   │
   │status:  │      │needed    │      │buffer    │      │messages  │
   │connected│      │          │      │          │      │array     │
   └─────────┘      └──────────┘      └─────┬────┘      └────┬─────┘
                                             │                 │
                                             ▼                 ▼
                                      ┌──────────┐      ┌──────────┐
                                      │Update    │      │Clear     │
                                      │streaming │      │buffer    │
                                      │message   │      │          │
                                      └──────────┘      └──────────┘

        ┌──────────────────┬──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────┐      ┌──────────┐      ┌──────────┐
   │system   │      │error     │      │(unknown) │
   │         │      │          │      │          │
   └────┬────┘      └─────┬────┘      └────┬─────┘
        │                 │                 │
        ▼                 ▼                 ▼
   ┌─────────┐      ┌──────────┐      ┌──────────┐
   │Add to   │      │Set error │      │Log       │
   │messages │      │state     │      │warning   │
   │with     │      │          │      │          │
   │metadata │      │          │      │          │
   └─────────┘      └──────────┘      └──────────┘
```

## Message Streaming Flow

```
User sends message → Backend receives → LLM generates response
                                               │
                                               ▼
                        ┌──────────────────────────────────────┐
                        │        LLM Streaming                  │
                        │                                       │
                        │  "Hello" → "Hello world" → "Hello    │
                        │             world, how" → ...         │
                        └──────────────┬───────────────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────────────┐
                        │    Backend sends SSE events:          │
                        │                                       │
                        │  Event 1: llm_chunk {content:"Hello"} │
                        │  Event 2: llm_chunk {content:" world"}│
                        │  Event 3: llm_chunk {content:", how"} │
                        │  ...                                  │
                        │  Event N: llm_complete {content:...}  │
                        └──────────────┬───────────────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────────────┐
                        │      Frontend Processing              │
                        │                                       │
                        │  Buffer: ""                           │
                        │  Buffer: "Hello"                      │
                        │  Buffer: "Hello world"                │
                        │  Buffer: "Hello world, how"           │
                        │  ...                                  │
                        │  Final: Move to messages array        │
                        └──────────────┬───────────────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────────────┐
                        │         UI Updates                    │
                        │                                       │
                        │  Display: "Hello▊"                    │
                        │  Display: "Hello world▊"              │
                        │  Display: "Hello world, how▊"         │
                        │  ...                                  │
                        │  Display: Final message (no cursor)   │
                        └───────────────────────────────────────┘
```

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                        ChatScreen                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Toggle Button                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                ChatSSEComponent                             │ │
│  │                                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │         ConnectionStatusIndicator                     │  │ │
│  │  │  • Status Dot                                         │  │ │
│  │  │  • Status Text                                        │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │         FlatList (Messages)                           │  │ │
│  │  │  ┌────────────────────────────────────────────────┐  │  │ │
│  │  │  │     MessageItem                                 │  │  │ │
│  │  │  │  • Message Bubble                               │  │  │ │
│  │  │  │  • Content Text                                 │  │  │ │
│  │  │  │  • BlinkingCursor (if streaming)                │  │  │ │
│  │  │  │  • Timestamp                                    │  │  │ │
│  │  │  └────────────────────────────────────────────────┘  │  │ │
│  │  │  (repeated for each message)                          │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │         Error Container (if error)                    │  │ │
│  │  │  • Error Text                                         │  │ │
│  │  │  • Retry Button                                       │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │         Input Container                               │  │ │
│  │  │  • TextInput                                          │  │ │
│  │  │  • Send IconButton                                    │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

                          Uses Hook ↓

┌─────────────────────────────────────────────────────────────────┐
│                       useChatSSE Hook                            │
│                                                                   │
│  State:                          Refs:                           │
│  • status                        • abortControllerRef            │
│  • error                         • reconnectAttemptsRef          │
│  • messages[]                    • reconnectTimeoutRef           │
│  • currentStreamingMessage       • currentStreamBufferRef        │
│                                  • callback refs                 │
│                                                                   │
│  Functions:                                                       │
│  • connect()                                                      │
│  • disconnect()                                                   │
│  • clearMessages()                                                │
│  • handleSSEEvent()                                               │
│  • parseSSEEvent()                                                │
│  • processStream()                                                │
│  • establishConnection()                                          │
│  • scheduleReconnect()                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Sequence

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User    │    │Component │    │   Hook   │    │ Backend  │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │ Sends Message │               │               │
     ├──────────────>│               │               │
     │               │               │               │
     │               │ Call API      │               │
     │               ├──────────────────────────────>│
     │               │               │               │
     │               │               │  SSE Stream   │
     │               │               │  Starts       │
     │               │               │<──────────────┤
     │               │               │               │
     │               │               │  Event:       │
     │               │               │  connected    │
     │               │<──────────────┤               │
     │               │               │               │
     │  Status:      │               │               │
     │  Connected    │               │               │
     │<──────────────┤               │               │
     │               │               │               │
     │               │               │  Event:       │
     │               │               │  llm_chunk    │
     │               │<──────────────┤<──────────────┤
     │               │               │               │
     │  Display:     │               │               │
     │  "Hello▊"     │               │               │
     │<──────────────┤               │               │
     │               │               │               │
     │               │               │  Event:       │
     │               │               │  llm_chunk    │
     │               │<──────────────┤<──────────────┤
     │               │               │               │
     │  Display:     │               │               │
     │  "Hello       │               │               │
     │   world▊"     │               │               │
     │<──────────────┤               │               │
     │               │               │               │
     │       (repeat for more chunks)                │
     │               │               │               │
     │               │               │  Event:       │
     │               │               │  llm_complete │
     │               │<──────────────┤<──────────────┤
     │               │               │               │
     │  Move to      │               │               │
     │  History      │               │               │
     │<──────────────┤               │               │
     │               │               │               │
     │               │               │  Event:       │
     │               │               │  heartbeat    │
     │               │<──────────────┤<──────────────┤
     │               │               │               │
     │  (every 30s)  │               │               │
     │               │               │               │
```

## State Transitions

```
┌─────────────────┐
│  disconnected   │
└────────┬────────┘
         │
         │ connect()
         ▼
┌─────────────────┐         ┌────────────────┐
│   connecting    │────────>│  reconnecting  │
└────────┬────────┘  error  └───────┬────────┘
         │                          │
         │ success                  │ retry
         ▼                          │
┌─────────────────┐                 │
│    connected    │<────────────────┘
└────────┬────────┘  success
         │
         │ error or
         │ disconnect()
         ▼
┌─────────────────┐
│  disconnected   │
└─────────────────┘
```

## Error Handling Flow

```
                    Error Occurs
                         │
                         ▼
                ┌────────────────┐
                │ Is Manual      │
                │ Disconnect?    │
                └───────┬────────┘
                        │
                ┌───────┴────────┐
                │                │
           Yes  │                │  No
                ▼                ▼
        ┌──────────────┐  ┌──────────────┐
        │ Stop         │  │ Check        │
        │ Reconnection │  │ Attempts     │
        └──────────────┘  └──────┬───────┘
                                 │
                      ┌──────────┴──────────┐
                      │                     │
                 < Max│                     │ >= Max
                      ▼                     ▼
              ┌──────────────┐      ┌──────────────┐
              │ Schedule     │      │ Show Final   │
              │ Reconnect    │      │ Error        │
              │ (exp backoff)│      │ Message      │
              └──────────────┘      └──────────────┘
```

## Memory Management

```
Component Mount
     │
     ▼
┌─────────────────────┐
│ Create refs         │
│ • abortController   │
│ • timeouts          │
│ • buffers           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Establish           │
│ Connection          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Events Flow         │
│ • Listeners active  │
│ • Buffers update    │
└──────────┬──────────┘
           │
           ▼
Component Unmount
     │
     ▼
┌─────────────────────┐
│ useEffect Cleanup   │
│ • abort()           │
│ • clearTimeout()    │
│ • null refs         │
└─────────────────────┘
           │
           ▼
    Memory Released
```

This visual representation shows the complete flow of data, state transitions, and component interactions in the SSE implementation.

