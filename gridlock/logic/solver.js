import { maxSlide, applyMove, serializeMove } from './moves.js'
import { isSolved } from './win.js'

/**
 * BFS 최소 이동수 solver. 오프라인/빌드타임 퍼즐 생성 파이프라인 전용 —
 * PSPACE-complete 특성상 클라이언트(브라우저)에서 실행하지 않는다 (기획 결정 사항).
 * @typedef {{solvable:boolean,minMoves:number|null,solution:string[],statesExplored:number}} SolveResult
 */

function stateKey(state) {
  return state.vehicles.map((v) => `${v.id}:${v.row},${v.col}`).join('|')
}

/** 한 상태에서 한 번의 "이동"으로 도달 가능한 모든 이웃 상태를 나열한다. */
function neighbors(state) {
  const out = []
  for (const v of state.vehicles) {
    for (const dir of [1, -1]) {
      const max = maxSlide(state, v.id, dir)
      for (let steps = 1; steps <= max; steps++) {
        out.push({ move: serializeMove(v.id, dir, steps), next: applyMove(state, v.id, dir, steps) })
      }
    }
  }
  return out
}

const SAFETY_DEPTH_LIMIT = 200

/**
 * @param {import('./board.js').GameState} initial
 * @param {number} [maxStatesExplored]
 * @returns {SolveResult}
 */
export function solve(initial, maxStatesExplored = 300_000) {
  if (isSolved(initial)) {
    return { solvable: true, minMoves: 0, solution: [], statesExplored: 1 }
  }

  const startKey = stateKey(initial)
  const cameFrom = new Map()
  const stateByKey = new Map([[startKey, initial]])
  let frontier = [initial]
  let statesExplored = 1

  for (let depth = 1; depth <= SAFETY_DEPTH_LIMIT; depth++) {
    const nextFrontier = []
    for (const current of frontier) {
      const currentKey = stateKey(current)
      for (const { move, next } of neighbors(current)) {
        const key = stateKey(next)
        if (stateByKey.has(key)) continue
        stateByKey.set(key, next)
        cameFrom.set(key, { prevKey: currentKey, move })
        statesExplored++

        if (isSolved(next)) {
          const solution = []
          let cursor = key
          while (cursor !== startKey) {
            const step = cameFrom.get(cursor)
            solution.unshift(step.move)
            cursor = step.prevKey
          }
          return { solvable: true, minMoves: depth, solution, statesExplored }
        }

        nextFrontier.push(next)
      }
      if (statesExplored > maxStatesExplored) {
        return { solvable: false, minMoves: null, solution: [], statesExplored }
      }
    }
    if (nextFrontier.length === 0) break
    frontier = nextFrontier
  }

  return { solvable: false, minMoves: null, solution: [], statesExplored }
}
