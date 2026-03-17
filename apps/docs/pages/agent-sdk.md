# Agent SDK Reference

## Agent Interface

Every LearnFlow agent implements the `AgentInterface`:

```typescript
interface AgentInterface {
  /** Initialize the agent with configuration */
  initialize(config?: Record<string, unknown>): void;

  /** Process an input and return a result */
  process(input: unknown): Promise<unknown>;

  /** Clean up resources */
  cleanup(): void;
}
```

## Agent Manifest Schema

Each agent requires a `manifest.json`:

```json
{
  "name": "my-custom-agent",
  "version": "1.0.0",
  "description": "A custom learning agent",
  "author": "Your Name",
  "capabilities": ["custom_capability"],
  "inputSchema": {
    "type": "object",
    "properties": {
      "topic": { "type": "string" },
      "depth": { "type": "string", "enum": ["beginner", "intermediate", "advanced"] }
    },
    "required": ["topic"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "result": { "type": "string" },
      "sources": { "type": "array" }
    }
  },
  "permissions": {
    "network": ["api.example.com"],
    "storage": true
  }
}
```

### Manifest Fields

| Field          | Type       | Required | Description                      |
| -------------- | ---------- | -------- | -------------------------------- |
| `name`         | string     | ✓        | Unique agent identifier          |
| `version`      | string     | ✓        | Semantic version                 |
| `description`  | string     | ✓        | What the agent does              |
| `author`       | string     | ✓        | Creator name                     |
| `capabilities` | string[]   | ✓        | List of capabilities for routing |
| `inputSchema`  | JSONSchema | ✓        | Zod-validated input shape        |
| `outputSchema` | JSONSchema | ✓        | Expected output shape            |
| `permissions`  | object     | ✓        | Network/storage access           |

## Building a Custom Agent

### Example: Vocabulary Agent

```typescript
import type { AgentInterface } from '@learnflow/agents';

export class VocabularyAgent implements AgentInterface {
  initialize() {
    // Load word databases, configure models
  }

  async process(input: { text: string; targetLevel: string }) {
    // Extract vocabulary, generate definitions, create exercises
    return {
      words: [
        {
          term: 'quantum',
          definition: 'The minimum amount of any physical entity',
          level: 'advanced',
        },
        { term: 'entanglement', definition: 'A quantum mechanical phenomenon', level: 'advanced' },
      ],
      exercises: [
        {
          type: 'fill-blank',
          sentence: 'In ___ computing, qubits can be in superposition.',
          answer: 'quantum',
        },
      ],
    };
  }

  cleanup() {
    // Release resources
  }
}
```

### Publishing to Marketplace

1. Create your agent with `manifest.json`
2. Test locally with the agent test harness
3. Submit via the API: `POST /api/v1/marketplace/agents`
4. Your agent enters the review queue
5. Once approved, it appears in the Agent Marketplace

## Security Sandbox

Custom agents run in a sandboxed environment:

- **Network**: Only allowed domains in `permissions.network`
- **Storage**: Scoped to agent's namespace
- **Execution**: Time-limited (30s default)
- **Memory**: Capped at 256MB
