# Round-Robin API Key Resilience

The API now routes requests through a small resilience layer before they reach the existing OpenAI-compatible Gemini worker.

## What it does

- Round-robins requests across configured Gemini API keys.
- Fails over to the next key when Gemini returns `408`, `425`, `429`, or `5xx`.
- Honors Gemini's `Retry-After` header when present.
- Uses exponential backoff when `Retry-After` is not provided.
- Keeps the OpenAI-compatible request and response format unchanged.
- Supports keys supplied through `GEMINI_API_KEYS`, `GEMINI_API_KEY`, or the incoming `Authorization: Bearer ...` header.

## Configuration

```env
GEMINI_API_KEYS=key_1,key_2,key_3,key_4
GEMINI_MAX_KEY_ATTEMPTS=4
GEMINI_RETRY_BASE_MS=250
GEMINI_RETRY_MAX_MS=8000
```

`GEMINI_MAX_KEY_ATTEMPTS` defaults to the number of configured keys and is capped at that number, so one request does not loop indefinitely.

## Important limitation

Round-robin improves availability and distributes traffic, but it cannot make a provider's quota or billing limits unlimited. Gemini rate limits are applied at the project level, so multiple keys in the same project do not create independent project quotas. Use keys/projects that you are authorized to operate and use Google's paid tiers or request higher limits when sustained production traffic requires them.

This layer is intended for legitimate availability, failover, and load distribution—not for bypassing provider controls.
