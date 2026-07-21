/**
 * 게임 시스템 디자이너가 정의한 퍼즐 데이터 스키마 (오프라인 생성 파이프라인의 산출 포맷).
 * 로직 레이어(board.js/moves.js/win.js)의 GameState와는 필드명이 다르므로 반드시 이 어댑터를 거쳐 변환한다.
 *
 * PuzzleSchema:
 * {
 *   id: string, version: number,
 *   board: { w: number, h: number, exit: { side: 'N'|'E'|'S'|'W', index: number } },
 *   vehicles: Array<{ id, x, y, len: 2|3, dir: 'H'|'V', isTarget?: boolean, type?: string }>,
 *   meta?: { minMoves?, difficulty?, solution?, ... }
 * }
 */

const SIDE_MAP = { E: 'right', W: 'left', N: 'top', S: 'bottom' }

/** 디자이너 스키마(N/E/S/W, x/y/len/dir) → 로직 타입(row/col/length/orientation) 변환 */
export function schemaToState(schema) {
  const exitSide = SIDE_MAP[schema.board.exit.side]
  const isHorizontalExit = exitSide === 'right' || exitSide === 'left'

  const board = {
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

  return { board, vehicles, status: 'IDLE', moveCount: 0 }
}
