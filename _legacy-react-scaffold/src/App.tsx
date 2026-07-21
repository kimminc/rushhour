import { useEffect } from 'react'
import { useGameStore } from './state/store'
import { seedPuzzles } from './data/puzzles'
import './App.css'

function vehicleColor(v: { isTarget: boolean; modelKey?: string }): string {
  if (v.isTarget) return '#e74c3c'
  if (v.modelKey?.includes('blue')) return '#3b82f6'
  if (v.modelKey?.includes('yellow')) return '#eab308'
  if (v.modelKey?.includes('green')) return '#22c55e'
  return '#94a3b8'
}

export default function App() {
  const { state, selectedVehicleId, puzzleId, selectVehicle, move, loadPuzzle } = useGameStore()

  useEffect(() => {
    loadPuzzle(seedPuzzles[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { board, vehicles, status, moveCount } = state
  const selected = vehicles.find((v) => v.id === selectedVehicleId) ?? null

  return (
    <div className="app">
      <h1>Gridlock</h1>
      <p className="subtitle">
        빨간 차를 오른쪽 출구로 빼내세요. (퍼즐: {puzzleId || '로딩 중'} · 이동 {moveCount}회)
      </p>

      <div
        className="board"
        style={{
          gridTemplateColumns: `repeat(${board.cols}, 56px)`,
          gridTemplateRows: `repeat(${board.rows}, 56px)`,
        }}
      >
        {vehicles.map((v) => (
          <button
            key={v.id}
            className={`vehicle${v.id === selectedVehicleId ? ' selected' : ''}`}
            style={{
              gridRow: `${v.row + 1} / span ${v.orientation === 'V' ? v.length : 1}`,
              gridColumn: `${v.col + 1} / span ${v.orientation === 'H' ? v.length : 1}`,
              backgroundColor: vehicleColor(v),
            }}
            onClick={() => selectVehicle(v.id)}
            aria-label={`차량 ${v.id}${v.isTarget ? ' (목표 차량)' : ''}`}
          />
        ))}
      </div>

      <div className="controls">
        {selected?.orientation === 'H' && (
          <>
            <button onClick={() => move(-1)} disabled={status !== 'IDLE'}>◀ 왼쪽</button>
            <button onClick={() => move(1)} disabled={status !== 'IDLE'}>오른쪽 ▶</button>
          </>
        )}
        {selected?.orientation === 'V' && (
          <>
            <button onClick={() => move(-1)} disabled={status !== 'IDLE'}>▲ 위</button>
            <button onClick={() => move(1)} disabled={status !== 'IDLE'}>아래 ▼</button>
          </>
        )}
        {!selected && <span className="hint">차량을 클릭해서 선택하세요</span>}
      </div>

      {status === 'SOLVED' && <div className="win-banner">🎉 클리어! {moveCount}수 만에 성공</div>}

      <button className="reset" onClick={() => loadPuzzle(seedPuzzles[0])}>
        다시하기
      </button>
    </div>
  )
}
