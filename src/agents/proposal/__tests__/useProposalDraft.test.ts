import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useProposalDraft } from '../useProposalDraft';

describe('useProposalDraft', () => {
  it('starts null', () => {
    const { result } = renderHook(() => useProposalDraft());

    expect(result.current.draft).toBeNull();
  });

  it('patch merges into the current draft state', () => {
    const { result } = renderHook(() => useProposalDraft());

    act(() => {
      result.current.patch({ title: 'Proposta inicial', clientName: 'Ana' });
    });
    act(() => {
      result.current.patch({ value: 'R$ 10.000' });
    });

    expect(result.current.draft).toEqual({
      title: 'Proposta inicial',
      clientName: 'Ana',
      value: 'R$ 10.000',
    });
  });

  it('reset clears', () => {
    const { result } = renderHook(() => useProposalDraft());

    act(() => {
      result.current.patch({ title: 'Proposta inicial' });
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.draft).toBeNull();
  });

  it('isSavable true with required fields', () => {
    const { result } = renderHook(() => useProposalDraft());

    act(() => {
      result.current.patch({
        title: 'Proposta inicial',
        clientName: 'Ana',
        projectDescription: 'Implantacao comercial',
      });
    });

    expect(result.current.isSavable).toBe(true);
  });

  it('isSavable false when missing required', () => {
    const { result } = renderHook(() => useProposalDraft());

    act(() => {
      result.current.patch({
        title: 'Proposta inicial',
        clientName: '   ',
        projectDescription: 'Implantacao comercial',
      });
    });

    expect(result.current.isSavable).toBe(false);
  });

  it('keeps the draft scoped to the mounted chat state', () => {
    const { result, unmount } = renderHook(() => useProposalDraft());

    act(() => {
      result.current.patch({ title: 'Proposta persistida', clientName: 'Ana' });
    });
    unmount();

    const remount = renderHook(() => useProposalDraft());

    expect(remount.result.current.draft).toBeNull();
  });
});
