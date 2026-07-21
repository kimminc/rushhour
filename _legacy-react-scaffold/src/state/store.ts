import { create } from 'zustand'
import type { Axis1, GameState } from '../logic/types'
import type { PuzzleSchema } from '../data/schema'
import { schemaToState } from '../data/adapter'
import { canMove, applyMove } from '../logic/moves'
import { isSolved } from '../logic/win'

interface Store {
  state: GameState
  selectedVehicleId: string | null
  puzzleId: string
  selectVehicle: (id: string) => void
  move: (dir: Axis1) => void
  loadPuzzle: (schema: PuzzleSchema) => void
}

/**
 * 상태머신: IDLE(입력 가능) → ANIMATING(입력 차단, ~180ms) → IDLE|SOLVED
 * 애니메이션 중 입력을 받으면 논리 상태와 화면이 어긋나는 버그가 생기므로 반드시 게이팅한다.
 * (technical-architect 설계 + critic이 지적한 "차단 피드백 부재" 보완: 선택 해제로 최소 피드백 제공)
 */
export function createStoreState(schema: PuzzleSchema) {
  return schemaToState(schema)
}

export const useGameStore = create<Store>((set, get) => ({
  state: { board: { rows: 6, cols: 6, exitRow: 0, exitCol: 0, exitSide: 'right' }, vehicles: [], status: 'IDLE', moveCount: 0 },
  selectedVehicleId: null,
  puzzleId: '',

  loadPuzzle: (schema) => {
    set({ state: schemaToState(schema), selectedVehicleId: null, puzzleId: schema.id })
  },

  selectVehicle: (id) => {
    const { state } = get()
    if (state.status !== 'IDLE') return
    set({ selectedVehicleId: id })
  },

  move: (dir) => {
    const { state, selectedVehicleId } = get()
    if (state.status !== 'IDLE' || !selectedVehicleId) return
    if (!canMove(state, selectedVehicleId, dir, 1)) return // 불가능한 이동은 조용히 무시 (게이팅)

    set({ state: { ...state, status: 'ANIMATING' } })

    setTimeout(() => {
      const current = get().state
      const next = applyMove(current, selectedVehicleId, dir, 1)
      const solved = isSolved(next)
      set({ state: { ...next, status: solved ? 'SOLVED' : 'IDLE' } })
    }, 180)
  },
}))
