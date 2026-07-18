import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/src/api/client'
import {
  createContractChild,
  createExceptionalHours,
  createExceptionalPresence,
  deleteContractChild,
  deleteExceptionalHours,
  deleteExceptionalPresence,
  fileDeclaration,
  getContractChildren,
  getDeclarations,
  getExceptionalHours,
  getExceptionalPresences,
  updateContractChild,
  updateDeclaration,
  updateExceptionalHours,
  updateExceptionalPresence,
} from '@/src/api/declarations'

afterEach(() => {
  vi.restoreAllMocks()
})

// biome-ignore lint/suspicious/noExplicitAny: canned axios response
const resp = (data: unknown) => ({ data }) as any

describe('contract children api', () => {
  it('getContractChildren fetches the contract collection', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue(resp([{ id: 'CC1' }]))
    const result = await getContractChildren('7', '2')
    expect(get).toHaveBeenCalledWith('/families/7/contracts/2/children/')
    expect(result).toEqual([{ id: 'CC1' }])
  })

  it('createContractChild posts to the contract', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue(resp({ id: 'CC1' }))
    const input = { child: 'C1', windows: [] }
    await createContractChild('7', '2', input)
    expect(post).toHaveBeenCalledWith(
      '/families/7/contracts/2/children/',
      input,
    )
  })

  it('updateContractChild patches by id', async () => {
    const patch = vi.spyOn(api, 'patch').mockResolvedValue(resp({ id: 'CC1' }))
    await updateContractChild('7', '2', 'CC1', { child: 'C2' })
    expect(patch).toHaveBeenCalledWith(
      '/families/7/contracts/2/children/CC1/',
      { child: 'C2' },
    )
  })

  it('deleteContractChild deletes by id', async () => {
    const del = vi.spyOn(api, 'delete').mockResolvedValue(resp(''))
    await deleteContractChild('7', '2', 'CC1')
    expect(del).toHaveBeenCalledWith('/families/7/contracts/2/children/CC1/')
  })
})

describe('exceptional hours api', () => {
  it('getExceptionalHours fetches the contract collection', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue(resp([{ id: 'H1' }]))
    const result = await getExceptionalHours('7', '2')
    expect(get).toHaveBeenCalledWith(
      '/families/7/contracts/2/exceptional-hours/',
    )
    expect(result).toEqual([{ id: 'H1' }])
  })

  it('createExceptionalHours posts to the contract', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue(resp({ id: 'H1' }))
    const input = {
      kind: 'night_presence' as const,
      start_date: '2026-07-06',
      start_time: '21:00',
      end_date: '2026-07-07',
      end_time: '07:00',
      interventions: 2,
    }
    await createExceptionalHours('7', '2', input)
    expect(post).toHaveBeenCalledWith(
      '/families/7/contracts/2/exceptional-hours/',
      input,
    )
  })

  it('updateExceptionalHours patches by id', async () => {
    const patch = vi.spyOn(api, 'patch').mockResolvedValue(resp({ id: 'H1' }))
    await updateExceptionalHours('7', '2', 'H1', { interventions: 3 })
    expect(patch).toHaveBeenCalledWith(
      '/families/7/contracts/2/exceptional-hours/H1/',
      { interventions: 3 },
    )
  })

  it('deleteExceptionalHours deletes by id', async () => {
    const del = vi.spyOn(api, 'delete').mockResolvedValue(resp(''))
    await deleteExceptionalHours('7', '2', 'H1')
    expect(del).toHaveBeenCalledWith(
      '/families/7/contracts/2/exceptional-hours/H1/',
    )
  })
})

describe('exceptional presences api', () => {
  it('getExceptionalPresences fetches the contract collection', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue(resp([{ id: 'P1' }]))
    const result = await getExceptionalPresences('7', '2')
    expect(get).toHaveBeenCalledWith(
      '/families/7/contracts/2/exceptional-presences/',
    )
    expect(result).toEqual([{ id: 'P1' }])
  })

  it('createExceptionalPresence posts to the contract', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue(resp({ id: 'P1' }))
    const input = {
      child: 'C1',
      date: '2026-07-08',
      start_time: '09:00',
      end_time: '12:00',
    }
    await createExceptionalPresence('7', '2', input)
    expect(post).toHaveBeenCalledWith(
      '/families/7/contracts/2/exceptional-presences/',
      input,
    )
  })

  it('updateExceptionalPresence patches by id', async () => {
    const patch = vi.spyOn(api, 'patch').mockResolvedValue(resp({ id: 'P1' }))
    await updateExceptionalPresence('7', '2', 'P1', { end_time: '13:00' })
    expect(patch).toHaveBeenCalledWith(
      '/families/7/contracts/2/exceptional-presences/P1/',
      { end_time: '13:00' },
    )
  })

  it('deleteExceptionalPresence deletes by id', async () => {
    const del = vi.spyOn(api, 'delete').mockResolvedValue(resp(''))
    await deleteExceptionalPresence('7', '2', 'P1')
    expect(del).toHaveBeenCalledWith(
      '/families/7/contracts/2/exceptional-presences/P1/',
    )
  })
})

describe('declarations api', () => {
  it('getDeclarations asks for one month', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue(resp([{ id: 'D1' }]))
    const result = await getDeclarations('7', '2', '2026-07')
    expect(get).toHaveBeenCalledWith('/families/7/contracts/2/declarations/', {
      params: { month: '2026-07' },
    })
    expect(result).toEqual([{ id: 'D1' }])
  })

  it('updateDeclaration patches the kilometers by id', async () => {
    const patch = vi.spyOn(api, 'patch').mockResolvedValue(resp({ id: 'D1' }))
    await updateDeclaration('7', '2', 'D1', { kilometers: '12.5' })
    expect(patch).toHaveBeenCalledWith(
      '/families/7/contracts/2/declarations/D1/',
      { kilometers: '12.5' },
    )
  })

  it('fileDeclaration posts to the freeze action', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue(resp({ id: 'D1' }))
    await fileDeclaration('7', '2', 'D1')
    expect(post).toHaveBeenCalledWith(
      '/families/7/contracts/2/declarations/D1/file/',
      {},
    )
  })
})
