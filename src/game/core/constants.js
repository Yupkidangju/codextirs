/*
 * [v3.8.0] 게임 상수 정의
 * 
 * 작성일: 2026-02-28
 * 변경사항:
 *   - MAX_SPEED_MULTIPLIER 2.5로 증가, T-스핀/콤보 상수 추가
 *   - Input Fidelity 2.0 기본 프리셋/버퍼 상수 추가
 */

// 보드 크기
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const CELL = 30;

// 입력 관련
export const DAS_MS = 135;        // Delayed Auto Shift (처음 딜레이)
export const ARR_MS = 40;         // Auto Repeat Rate (반복 속도)
export const LOCK_DELAY_MS = 500; // 블록 고정 지연 시간
export const SOFT_DROP_MULTIPLIER = 20; // 소프트 드롭 가속 배율
export const DEFAULT_INPUT_BUFFER_MS = 110; // 스폰 직후 버퍼 기본 시간
export const DEFAULT_SOFT_DROP_REPEAT_MS = 32; // 소프트 드롭 반복 기본 시간
export const DEFAULT_LOCK_RESET_LIMIT = 15; // 락 지연 리셋 제한 기본값
export const INPUT_BUFFER_ACTIONS = ["rotateCW", "rotateCCW", "hold", "hardDrop"]; // 버퍼 가능한 액션

// 속도 관련
export const BASE_DROP_PER_SEC = 1.0;
export const MAX_SPEED_MULTIPLIER = 2.5;  // [v2.0.0] 1.8 → 2.5
export const LEVEL_SPAN = 20;

// 레벨업 공식: 목표 제거 줄 수
export function levelTarget(level) {
  return 20 + Math.floor(((level - 1) * 10) / 20);
}

export const INPUT_PRESETS = {
  standard: {
    dasMs: 135,
    arrMs: 40,
    softDropRepeatMs: 32,
    inputBufferMs: 110,
    lockResetLimit: 15,
    irsEnabled: true,
    ihsEnabled: true,
    hardDropBufferEnabled: true,
  },
  arcade: {
    dasMs: 110,
    arrMs: 16,
    softDropRepeatMs: 28,
    inputBufferMs: 100,
    lockResetLimit: 15,
    irsEnabled: true,
    ihsEnabled: true,
    hardDropBufferEnabled: true,
  },
  control: {
    dasMs: 150,
    arrMs: 50,
    softDropRepeatMs: 36,
    inputBufferMs: 120,
    lockResetLimit: 15,
    irsEnabled: false,
    ihsEnabled: true,
    hardDropBufferEnabled: true,
  },
  mobileSafe: {
    dasMs: 145,
    arrMs: 55,
    softDropRepeatMs: 40,
    inputBufferMs: 120,
    lockResetLimit: 15,
    irsEnabled: false,
    ihsEnabled: false,
    hardDropBufferEnabled: true,
  },
};

// 속도 배율 공식
export function speedMultiplier(level) {
  return Math.min(MAX_SPEED_MULTIPLIER, 1 + (level - 1) * 0.08);
}

// T-스핀 체크 관련 상수
export const TSPIN_CHECK_POINTS = [
  [-1, -1], [1, -1],  // 상단 좌우
  [-1, 1], [1, 1]     // 하단 좌우
];

// 점수 배율
export const SCORE_TABLE = {
  SINGLE: 100,
  DOUBLE: 300,
  TRIPLE: 500,
  TETRIS: 800,
  TSPIN_MINI: 100,
  TSPIN_SINGLE: 200,
  TSPIN_DOUBLE: 400,
  TSPIN_TRIPLE: 600,
  PERFECT_CLEAR: 3000,
  COMBO_MULTIPLIER: 0.2,  // 콤보당 20% 추가
  BACK_TO_BACK_MULTIPLIER: 1.5,  // 백투백 1.5배
};

// 가비지 라인 공식
export function garbageForLines(lines, tspinType, isBackToBack) {
  let garbage = 0;
  
  switch (lines) {
    case 1: garbage = tspinType ? (tspinType === 'mini' ? 0 : 2) : 0; break;
    case 2: garbage = tspinType ? (tspinType === 'mini' ? 1 : 4) : 1; break;
    case 3: garbage = tspinType ? 6 : 2; break;
    case 4: garbage = 4; break;
  }
  
  // 백투백 병 추가
  if (isBackToBack && (lines >= 4 || tspinType)) {
    garbage += 1;
  }
  
  return garbage;
}

// 필살기 게이지 관련
export const GAUGE_MAX = 100;
export const GAUGE_PER_LINE = 5;       // 라인당 5%
export const GAUGE_PER_TSPIN = 15;     // T-스핀당 15%
export const GAUGE_PER_PERFECT_CLEAR = 50;  // 퍼펙트 클리어 50%

// 파워업 관련
export const POWERUP_SPAWN_INTERVAL = 20; // 20초마다
export const POWERUP_DURATION = 10;       // 파워업 지속시간
