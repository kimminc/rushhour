import type { Board, GameState, ExitSide } from '../logic/types'
import type { PuzzleSchema } from './schema'

const SIDE_MAP: Record<PuzzleSchema['board']['exit']['side'], ExitSide> = {
  E: 'right',
  W: 'left',
  N: 'top',
  S: 'bottom',
}

/** 디자이너 스키마(N/E/S/W, x/y/len/dir) → 로직 타입(row/col/length/orientation) 변환 */
export function schemaToState(schema: PuzzleSchema): GameState {
  const exitSide = SIDE_MAP[schema.board.exit.side]
  const isHorizontalExit = exitSide === 'right' || exitSide === 'left'

  const board: Board = {
    rows: schema.board.h,
    cols: schema.board.w,
    exitRow: isHorizontalExit ? schema.board.exit.index : 0,
    exitCol: isHorizontalExit ? 0 : schema.board.exit.index,
    exitSide,
  }

  const vehicles = schema.vehicles.map((v) => ({
    id: v.id,
    row: v.y,
    col: v.x,
    length: v.len,
    orientation: v.dir,
    isTarget: v.isTarget ?? false,
    modelKey: v.type,
  }))

  return { board, vehicles, status: 'IDLE' as const, moveCount: 0 }
}
