# OpenAI-Compatible Gemini API

A serverless API gateway that exposes a **Gemini-backed endpoint using an OpenAI-compatible interface**, making Gemini models easier to integrate with tools that expect OpenAI-style APIs.

> This repository is based on an existing open-source implementation. See the upstream project and its license/history before redistributing or presenting it as original work.

## What It Provides

- OpenAI-compatible `chat/completions` endpoint
- Embeddings endpoint
- Models endpoint
- Streaming responses
- Vision and audio input support where supported by the underlying model
- Gemini-specific options through `extra_body`
- Deployable on serverless platforms

## Typical Architecture

```text
OpenAI-compatible client
          ↓
     API endpoint
          ↓
 Gemini API / models
```

## API Key Configuration

Provide your own Gemini API key through the hosting platform's environment variables or local environment configuration.

```env
GEMINI_API_KEYS=your_key_1,your_key_2
```

**Never commit real API keys to the repository.**

## Local Development

```bash
npm install
npm run start
```

Development mode:

```bash
npm run dev
```

## Compatible API Shape

Example base URL:

```text
https://your-deployment.example/v1
```

Clients can then use their normal OpenAI-compatible configuration with the deployment URL and their own Gemini credentials, subject to the implementation's authentication model.

## Supported Operations

- `chat/completions`
- `embeddings`
- `models`

## Deployment

The implementation includes deployment paths for serverless platforms. Follow the platform-specific configuration in the source and use platform-managed environment variables for credentials.

## Author / Maintainer

**Muhammad Suliman** — Software Engineer

[GitHub](https://github.com/sulmanfarooqq) · [LinkedIn](https://www.linkedin.com/in/sulmanfarooqq/) · [Portfolio](https://sulmanfarooq.netlify.app)
