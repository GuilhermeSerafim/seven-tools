import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createProposalChatAdapter } from '../useProposalChatAdapter';
import type { AdapterSendInput } from '../useProposalChatAdapter';
import type { ProposalDraft } from '../useProposalDraft';

const draft: ProposalDraft = {
  title: 'Proposta SEVEN',
  clientName: 'Ana',
  projectDescription: 'Hub comercial',
};

const messages: AdapterSendInput[] = [
  {
    role: 'user',
    content: 'Crie uma proposta',
    attachments: [],
  },
];

function makeResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

function makeAdapter(overrides = {}) {
  return createProposalChatAdapter({
    authToken: 'token-123',
    getDraft: () => draft,
    getCurrentProposalId: () => 'proposal-current',
    getLastSavedProposalId: () => 'proposal-last',
    getIntentHint: () => 'create',
    apiBaseUrl: 'https://api.seven.test',
    ...overrides,
  });
}

function makeAdapterWithDefaultBaseUrl() {
  return createProposalChatAdapter({
    authToken: 'token-123',
    getDraft: () => draft,
    getCurrentProposalId: () => 'proposal-current',
    getLastSavedProposalId: () => 'proposal-last',
    getIntentHint: () => 'create',
  });
}

describe('createProposalChatAdapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('uses the repo API base convention by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      makeResponse({
        reply: 'Ok',
        tool_result: null,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await makeAdapterWithDefaultBaseUrl().send(messages, new AbortController().signal);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/ai/proposal-assistant',
      expect.any(Object),
    );
  });

  it('keeps the apiBaseUrl override and avoids double slashes', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      makeResponse({
        reply: 'Ok',
        tool_result: null,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await makeAdapter({ apiBaseUrl: 'https://api.seven.test/' }).send(
      messages,
      new AbortController().signal,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.seven.test/ai/proposal-assistant',
      expect.any(Object),
    );
  });

  it('sends messages, draft, proposal ids and intent in body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      makeResponse({
        reply: 'Vamos montar a proposta.',
        tool_result: null,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await makeAdapter().send(messages, new AbortController().signal);

    expect(result).toEqual({
      reply: 'Vamos montar a proposta.',
      toolResult: null,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.seven.test/ai/proposal-assistant',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        },
        body: JSON.stringify({
          messages,
          current_draft: draft,
          current_proposal_id: 'proposal-current',
          last_saved_proposal_id: 'proposal-last',
          intent_hint: 'create',
        }),
      }),
    );
  });

  it('falls back to the stored auth token and lets an explicit proposal context win', async () => {
    localStorage.setItem('seventools_token', 'stored-token');
    const fetchMock = vi.fn().mockResolvedValue(
      makeResponse({
        reply: 'Ok',
        tool_result: null,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await makeAdapter({ authToken: '' }).send(
      messages,
      new AbortController().signal,
      'proposal-picked',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.seven.test/ai/proposal-assistant',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer stored-token',
        },
        body: JSON.stringify({
          messages,
          current_draft: draft,
          current_proposal_id: 'proposal-picked',
          last_saved_proposal_id: 'proposal-last',
          intent_hint: 'create',
        }),
      }),
    );
  });

  it('parses tool_result discriminated union into toolResult', async () => {
    const toolResult = {
      kind: 'proposal_draft_patch',
      patch: { clientEmail: 'ana@example.com' },
      missing_required: ['value'],
    } as const;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        makeResponse({
          reply: 'Atualizei o rascunho.',
          tool_result: toolResult,
        }),
      ),
    );

    await expect(makeAdapter().send(messages, new AbortController().signal)).resolves.toEqual({
      reply: 'Atualizei o rascunho.',
      toolResult,
    });
  });

  it('propagates abort signal', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      makeResponse({
        reply: 'Ok',
        tool_result: null,
      }),
    );
    const controller = new AbortController();
    vi.stubGlobal('fetch', fetchMock);

    await makeAdapter().send(messages, controller.signal);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it('throws on non-ok with status code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse({ detail: 'Nope' }, { status: 503 })));

    await expect(makeAdapter().send(messages, new AbortController().signal)).rejects.toThrow(
      /503/,
    );
  });
});
