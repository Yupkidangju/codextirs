/*
 * [v3.11.0] 필살기 스킬 시스템
 *
 * 작성일: 2026-02-28
 * 변경사항: 3가지 스킬 추가 (블라인드, 블록 스왑, 가비지 반사)
 *   - [v3.9.0] Rule-Break Boss용 게이지 흡수 API 추가
 *   - [v3.11.0] 스킬 합성 기록 및 합성 판정 추가
 */

import { GAUGE_MAX, GAUGE_PER_LINE, GAUGE_PER_TSPIN, GAUGE_PER_PERFECT_CLEAR, BOARD_WIDTH, BOARD_HEIGHT } from "../core/constants.js";

// ============================================================================
// 스킬 타입 정의
// ============================================================================

/**
 * 스킬 종류 열거형
 * [v5.0.0] 3가지 필살기 스킬 정의
 */
export const SkillType = {
  BLIND: "blind",              // 블라인드 (1)
  BLOCK_SWAP: "blockSwap",     // 블록 스왑 (2)
  GARBAGE_REFLECT: "garbageReflect", // 가비지 반사 (3)
};

export const SkillFusionType = {
  PHANTOM_MIRROR: "phantomMirror",
  DISTORT_FIELD: "distortField",
  BACKFLOW_SHIFT: "backflowShift",
};

const SKILL_FUSION_WINDOW_MS = 4000;

const SKILL_FUSION_RULES = {
  [`${SkillType.BLIND}->${SkillType.GARBAGE_REFLECT}`]: {
    type: SkillFusionType.PHANTOM_MIRROR,
    name: "Phantom Mirror",
    nameKo: "팬텀 미러",
  },
  [`${SkillType.BLOCK_SWAP}->${SkillType.BLIND}`]: {
    type: SkillFusionType.DISTORT_FIELD,
    name: "Distort Field",
    nameKo: "디스토트 필드",
  },
  [`${SkillType.GARBAGE_REFLECT}->${SkillType.BLOCK_SWAP}`]: {
    type: SkillFusionType.BACKFLOW_SHIFT,
    name: "Backflow Shift",
    nameKo: "백플로우 시프트",
  },
};

/**
 * 스킬 설정
 * [v5.0.0] 각 스킬의 속성 및 파라미터 정의
 */
const SKILL_CONFIG = {
  [SkillType.BLIND]: {
    name: "블라인드",          // 한국어
    nameEn: "Blind",           // 영어
    nameJa: "ブラインド",      // 일본어
    nameZhTw: "盲目",          // 중국어(번체)
    nameZhCn: "致盲",          // 중국어(간체)
    key: "1",
    cost: 100,                 // 게이지 소모량 (%)
    duration: 5000,            // 지속 시간 (ms)
    description: "상대방 보드를 5초간 안개로 가립니다",
  },
  [SkillType.BLOCK_SWAP]: {
    name: "블록 스왑",
    nameEn: "Block Swap",
    nameJa: "ブロック交換",
    nameZhTw: "方塊交換",
    nameZhCn: "方块交换",
    key: "2",
    cost: 100,
    duration: 0,               // 즉시 발동
    swapCount: 2,              // 스왑할 열 쌍 수
    description: "상대방 보드의 2개 열을 무작위로 교환합니다",
  },
  [SkillType.GARBAGE_REFLECT]: {
    name: "가비지 반사",
    nameEn: "Garbage Reflect",
    nameJa: "ガーベジ反射",
    nameZhTw: "垃圾反射",
    nameZhCn: "垃圾反射",
    key: "3",
    cost: 100,
    duration: 5000,            // 지속 시간 (ms)
    description: "5초간 받는 가비지를 상대에게 반사합니다",
  },
};

// ============================================================================
// 스킬 상태 관리 클래스
// ============================================================================

/**
 * SkillManager 클래스
 * [v5.0.0] 스킬 게이지 및 효과 상태 관리
 *
 * 기능:
 * - 스킬 게이지 충전 (라인 클리어, T-스핀, 퍼펙트 클리어)
 * - 3가지 스킬 발동 및 지속 시간 관리
 * - 상대방 스킬 효과 적용 (블라인드, 블록 스왑)
 */
export class SkillManager {
  constructor(playerId) {
    this.playerId = playerId;           // 'player' 또는 'ai'

    // 게이지 시스템
    this.gauge = 0;                     // 현재 게이지 (0-100)
    this.isGaugeMax = false;            // 게이지 MAX 여부

    // 활성화된 스킬 효과
    this.activeEffects = {
      blind: { active: false, endTime: 0 },           // 블라인드 (적용 중인 효과)
      garbageReflect: { active: false, endTime: 0 },  // 가비지 반사
    };

    // 블록 스왑 애니메이션 상태
    this.swapAnimation = {
      active: false,
      startTime: 0,
      duration: 500,                     // 애니메이션 지속 시간 (ms)
      swapPairs: [],                     // 스왑할 열 쌍 정보
    };

    // 스킬 사용 콜백 (외부에서 설정)
    this.onSkillUse = null;
    this.onGaugeChange = null;
    this.lastSkillUse = { type: null, at: 0 };
  }

  // --------------------------------------------------------------------------
  // 게이지 관리
  // --------------------------------------------------------------------------

  /**
   * 라인 클리어로 게이지 충전
   * [v5.0.0] 클리어한 라인 수에 따라 게이지 충전
   *
   * @param {number} lines - 클리어한 라인 수
   * @param {boolean} isTSpin - T-스핀 여부
   * @param {boolean} isPerfectClear - 퍼펙트 클리어 여부
   * @returns {number} 충전된 게이지량
   */
  addGaugeByLines(lines, isTSpin = false, isPerfectClear = false) {
    let added = 0;

    // 기본 라인 클리어 게이지
    if (lines > 0) {
      added += lines * GAUGE_PER_LINE;  // 라인당 게이지 상수 적용
    }

    // T-스핀 별도 보너스
    if (isTSpin) {
      added += GAUGE_PER_TSPIN;
    }

    // 퍼펙트 클리어 별도 보너스
    if (isPerfectClear) {
      added += GAUGE_PER_PERFECT_CLEAR;
    }

    return this.addGauge(added);
  }

  /**
   * 게이지 직접 추가
   * [v5.0.0] 지정된 양만큼 게이지 충전
   *
   * @param {number} amount - 추가할 게이지량 (0-100)
   * @returns {number} 충전된 실제 게이지량
   */
  addGauge(amount) {
    const prevGauge = this.gauge;
    this.gauge = Math.min(GAUGE_MAX, this.gauge + amount);

    // MAX 상태 업데이트
    const wasMax = this.isGaugeMax;
    this.isGaugeMax = this.gauge >= GAUGE_MAX;

    // 게이지 변화 콜백
    if (this.onGaugeChange && prevGauge !== this.gauge) {
      this.onGaugeChange(this.gauge, this.isGaugeMax);
    }

    return this.gauge - prevGauge;
  }

  /**
   * 게이지 직접 설정
   * [v3.9.0] 규칙 공격이 현재 게이지를 즉시 조정해야 할 때 사용
   *
   * @param {number} value - 설정할 게이지 값
   * @returns {number} 변경 후 게이지 값
   */
  setGauge(value) {
    const prevGauge = this.gauge;
    this.gauge = Math.max(0, Math.min(GAUGE_MAX, Number(value) || 0));
    this.isGaugeMax = this.gauge >= GAUGE_MAX;

    if (this.onGaugeChange && prevGauge !== this.gauge) {
      this.onGaugeChange(this.gauge, this.isGaugeMax);
    }

    return this.gauge;
  }

  /**
   * 게이지 직접 감소
   * [v3.9.0] 보스 규칙 공격에 의한 흡수/대가 처리
   *
   * @param {number} amount - 감소시킬 게이지 양
   * @returns {number} 실제 감소한 게이지 양
   */
  drainGauge(amount) {
    const prevGauge = this.gauge;
    this.setGauge(this.gauge - Math.max(0, Number(amount) || 0));
    return prevGauge - this.gauge;
  }

  /**
   * 스킬 사용으로 게이지 소모
   * [v5.0.0] 스킬 사용 후 게이지를 0으로 리셋
   */
  consumeGauge() {
    this.gauge = 0;
    this.isGaugeMax = false;

    if (this.onGaugeChange) {
      this.onGaugeChange(this.gauge, this.isGaugeMax);
    }
  }

  /**
   * 현재 게이지 반환
   * @returns {number} 0-100 사이의 게이지 값
   */
  getGauge() {
    return this.gauge;
  }

  /**
   * 게이지 MAX 여부 확인
   * @returns {boolean}
   */
  isGaugeFull() {
    return this.isGaugeMax;
  }

  // --------------------------------------------------------------------------
  // 스킬 사용
  // --------------------------------------------------------------------------

  /**
   * 스킬 사용 가능 여부 확인
   * [v5.0.0] 게이지 MAX 상태에서만 스킬 사용 가능
   *
   * @param {string} skillType - 스킬 타입 (SkillType 값)
   * @returns {boolean} 사용 가능 여부
   */
  canUseSkill(skillType) {
    if (!SKILL_CONFIG[skillType]) return false;
    if (!this.isGaugeMax) return false;
    return true;
  }

  /**
   * 스킬 발동
   * [v5.0.0] 스킬 효과 적용 및 게이지 소모
   *
   * @param {string} skillType - 스킬 타입
   * @param {Object} targetBoard - 대상 보드 (블록 스왑용)
   * @returns {Object} 스킬 발동 결과
   */
  useSkill(skillType, targetBoard = null) {
    if (!this.canUseSkill(skillType)) {
      return { success: false, reason: "게이지 부족" };
    }

    const config = SKILL_CONFIG[skillType];
    const now = performance.now();
    let result = { success: true, type: skillType, data: {}, fusion: null };

    switch (skillType) {
      case SkillType.BLIND:
        // 블라인드는 자신에게 적용 (상대가 나를 볼 수 없게)
        // 실제로는 상대방의 SkillManager에 블라인드 효과를 적용해야 함
        result.data = {
          duration: config.duration,
          endTime: now + config.duration,
        };
        break;

      case SkillType.BLOCK_SWAP:
        // 블록 스왑은 상대방 보드에 적용
        if (targetBoard) {
          const swapResult = this._executeBlockSwap(targetBoard);
          result.data = swapResult;
        }
        break;

      case SkillType.GARBAGE_REFLECT:
        // 가비지 반사는 자신에게 적용
        this.activeEffects.garbageReflect = {
          active: true,
          endTime: now + config.duration,
        };
        result.data = {
          duration: config.duration,
          endTime: now + config.duration,
        };
        break;
    }

    // 게이지 소모
    this.consumeGauge();

    // [v3.11.0] 이전 스킬 사용 기록과 현재 입력을 조합해 합성 스킬을 판정한다.
    result.fusion = this._resolveFusion(skillType, now);
    this.lastSkillUse = { type: skillType, at: now };

    // 스킬 사용 콜백
    if (this.onSkillUse) {
      this.onSkillUse(skillType, result);
    }

    return result;
  }

  /**
   * 스킬 합성 판정
   * [v3.11.0] 직전 스킬과 현재 스킬이 4초 이내 연속 입력이면 합성 결과를 반환한다.
   *
   * @param {string} skillType - 현재 스킬 타입
   * @param {number} now - 현재 시각
   * @returns {Object|null} 합성 정보
   */
  _resolveFusion(skillType, now) {
    const previousType = this.lastSkillUse?.type;
    const previousAt = this.lastSkillUse?.at || 0;
    if (!previousType || now - previousAt > SKILL_FUSION_WINDOW_MS) {
      return null;
    }
    return SKILL_FUSION_RULES[`${previousType}->${skillType}`] || null;
  }

  /**
   * 블록 스왑 실행
   * [v5.0.0] 상대방 보드의 무작위 2개 열을 교환
   *
   * @param {Object} board - 대상 보드 객체 (grid 속성 필요)
   * @returns {Object} 스왑 결과
   */
  _executeBlockSwap(board) {
    if (!board || !board.grid) return { success: false, reason: "유효하지 않은 보드" };

    const config = SKILL_CONFIG[SkillType.BLOCK_SWAP];
    const swapCount = config.swapCount;
    const width = board.grid[0]?.length || BOARD_WIDTH;

    // 무작위 열 선택 (중복 없이)
    const columns = [];
    while (columns.length < swapCount * 2) {
      const col = Math.floor(Math.random() * width);
      if (!columns.includes(col)) {
        columns.push(col);
      }
    }

    // 열 쌍 생성
    const swapPairs = [];
    for (let i = 0; i < swapCount; i++) {
      swapPairs.push([columns[i * 2], columns[i * 2 + 1]]);
    }

    // 실제 스왑 실행
    for (const [col1, col2] of swapPairs) {
      for (let row = 0; row < board.grid.length; row++) {
        const temp = board.grid[row][col1];
        board.grid[row][col1] = board.grid[row][col2];
        board.grid[row][col2] = temp;
      }
    }

    // 스왑 애니메이션 설정
    this.swapAnimation = {
      active: true,
      startTime: performance.now(),
      duration: 500,
      swapPairs: swapPairs,
    };

    return {
      success: true,
      swapPairs: swapPairs,
    };
  }

  // --------------------------------------------------------------------------
  // 외부 효과 적용
  // --------------------------------------------------------------------------

  /**
   * 블라인드 효과 적용 (상대방이 사용)
   * [v5.0.0] 상대방이 블라인드 스킬 사용 시 호출
   *
   * @param {number} duration - 지속 시간 (ms)
   */
  applyBlind(duration) {
    const now = performance.now();
    this.activeEffects.blind = {
      active: true,
      endTime: now + duration,
    };
  }

  /**
   * 블록 스왑 효과 적용 (상대방이 사용)
   * [v5.0.0] 상대방이 블록 스왑 스킬 사용 시 호출
   *
   * @param {Object} board - 스왑될 보드
   * @returns {Object} 스왑 결과
   */
  applyBlockSwap(board) {
    return this._executeBlockSwap(board);
  }

  // --------------------------------------------------------------------------
  // 효과 상태 확인
  // --------------------------------------------------------------------------

  /**
   * 블라인드 효과 활성화 여부
   * [v5.0.0] 현재 블라인드 상태 확인
   *
   * @returns {boolean}
   */
  isBlindActive() {
    return this.activeEffects.blind.active;
  }

  /**
   * 가비지 반사 효과 활성화 여부
   * [v5.0.0] 현재 가비지 반사 상태 확인
   *
   * @returns {boolean}
   */
  isGarbageReflectActive() {
    return this.activeEffects.garbageReflect.active;
  }

  /**
   * 블록 스왑 애니메이션 활성화 여부
   * [v5.0.0] 현재 스왑 애니메이션 상태 확인
   *
   * @returns {boolean}
   */
  isSwapAnimationActive() {
    return this.swapAnimation.active;
  }

  // --------------------------------------------------------------------------
  // 업데이트
  // --------------------------------------------------------------------------

  /**
   * 스킬 효과 업데이트
   * [v5.0.0] 매 프레임 호출하여 지속 효과 갱신
   *
   * @param {number} dt - 델타 시간 (초)
   */
  update(dt) {
    const now = performance.now();

    // 블라인드 효과 체크
    if (this.activeEffects.blind.active) {
      if (now >= this.activeEffects.blind.endTime) {
        this.activeEffects.blind.active = false;
      }
    }

    // 가비지 반사 효과 체크
    if (this.activeEffects.garbageReflect.active) {
      if (now >= this.activeEffects.garbageReflect.endTime) {
        this.activeEffects.garbageReflect.active = false;
      }
    }

    // 스왑 애니메이션 체크
    if (this.swapAnimation.active) {
      const elapsed = now - this.swapAnimation.startTime;
      if (elapsed >= this.swapAnimation.duration) {
        this.swapAnimation.active = false;
      }
    }
  }

  /**
   * 리셋
   * [v5.0.0] 모든 스킬 상태 초기화 (새 게임 시)
   */
  reset() {
    this.gauge = 0;
    this.isGaugeMax = false;

    this.activeEffects.blind = { active: false, endTime: 0 };
    this.activeEffects.garbageReflect = { active: false, endTime: 0 };

    this.swapAnimation = {
      active: false,
      startTime: 0,
      duration: 500,
      swapPairs: [],
    };
    this.lastSkillUse = { type: null, at: 0 };
  }
}

// ============================================================================
// 전역 스킬 관리자 (싱글톤)
// ============================================================================

// 플레이어와 AI의 스킬 매니저 인스턴스
let playerSkillManager = null;
let aiSkillManager = null;

/**
   * 스킬 시스템 초기화
   * [v5.0.0] 새 게임 시작 시 호출
   */
export function initSkillSystem() {
  playerSkillManager = new SkillManager("player");
  aiSkillManager = new SkillManager("ai");
  console.log("[SkillSystem] 스킬 시스템 초기화 완료");
}

/**
   * 플레이어 스킬 매니저 반환
   * @returns {SkillManager}
   */
export function getPlayerSkillManager() {
  if (!playerSkillManager) {
    playerSkillManager = new SkillManager("player");
  }
  return playerSkillManager;
}

/**
   * AI 스킬 매니저 반환
   * @returns {SkillManager}
   */
export function getAiSkillManager() {
  if (!aiSkillManager) {
    aiSkillManager = new SkillManager("ai");
  }
  return aiSkillManager;
}

/**
   * 스킬 매니저 반환 (ID로)
   * @param {string} playerId - 'player' 또는 'ai'
   * @returns {SkillManager}
   */
export function getSkillManager(playerId) {
  return playerId === "player" ? getPlayerSkillManager() : getAiSkillManager();
}

// ============================================================================
// 편의 함수들
// ============================================================================

/**
   * 게이지 추가 (플레이어)
   * [v5.0.0] 플레이어 게이지 충전
   *
   * @param {number} lines - 클리어한 라인 수
   * @param {boolean} isTSpin - T-스핀 여부
   * @param {boolean} isPerfectClear - 퍼펙트 클리어 여부
   * @returns {number} 충전된 게이지량
   */
export function addPlayerGauge(lines, isTSpin = false, isPerfectClear = false) {
  return getPlayerSkillManager().addGaugeByLines(lines, isTSpin, isPerfectClear);
}

/**
   * 게이지 추가 (AI)
   * [v5.0.0] AI 게이지 충전
   *
   * @param {number} lines - 클리어한 라인 수
   * @param {boolean} isTSpin - T-스핀 여부
   * @param {boolean} isPerfectClear - 퍼펙트 클리어 여부
   * @returns {number} 충전된 게이지량
   */
export function addAiGauge(lines, isTSpin = false, isPerfectClear = false) {
  return getAiSkillManager().addGaugeByLines(lines, isTSpin, isPerfectClear);
}

/**
   * 스킬 사용
   * [v5.0.0] 스킬 발동
   *
   * @param {string} skillType - 스킬 타입
   * @param {string} userId - 사용 주체 ('player' 또는 'ai')
   * @returns {Object} 스킬 발동 결과
   */
export function useSkill(skillType, userId = "player", targetBoard = null) {
  const manager = getSkillManager(userId);
  return manager.useSkill(skillType, targetBoard);
}

/**
   * 스킬 사용 가능 여부
   * [v5.0.0] 스킬 사용 가능 여부 확인
   *
   * @param {string} skillType - 스킬 타입
   * @param {string} userId - 확인 주체 ('player' 또는 'ai')
   * @returns {boolean}
   */
export function isSkillAvailable(skillType, userId = "player") {
  return getSkillManager(userId).canUseSkill(skillType);
}

/**
   * 활성화된 스킬 효과 반환
   * [v5.0.0] 현재 적용 중인 스킬 효과 목록
   *
   * @param {string} userId - 확인 주체 ('player' 또는 'ai')
   * @returns {Object} 활성 효과 목록
   */
export function getActiveSkills(userId = "player") {
  const manager = getSkillManager(userId);
  return {
    blind: manager.isBlindActive(),
    garbageReflect: manager.isGarbageReflectActive(),
    swapAnimation: manager.isSwapAnimationActive(),
  };
}

/**
   * 스킬 시스템 업데이트
   * [v5.0.0] 매 프레임 호출
   *
   * @param {number} dt - 델타 시간 (초)
   */
export function updateSkills(dt) {
  getPlayerSkillManager().update(dt);
  getAiSkillManager().update(dt);
}

/**
   * 스킬 시스템 리셋
   * [v5.0.0] 새 게임 시작 시 호출
   */
export function resetSkillSystem() {
  if (playerSkillManager) playerSkillManager.reset();
  if (aiSkillManager) aiSkillManager.reset();
}

/**
   * 스킬 설정 반환
   * [v5.0.0] 스킬 설정 정보 반환
   *
   * @param {string} skillType - 스킬 타입
   * @returns {Object} 스킬 설정
   */
export function getSkillConfig(skillType) {
  return SKILL_CONFIG[skillType] || null;
}

/**
   * 모든 스킬 설정 반환
   * [v5.0.0] 모든 스킬 설정 정보 반환
   *
   * @returns {Object} 모든 스킬 설정
   */
export function getAllSkillConfigs() {
  return { ...SKILL_CONFIG };
}

export function getSkillFusionWindowMs() {
  return SKILL_FUSION_WINDOW_MS;
}

/**
   * 게이지 렌더링
   * [v5.0.0] 스킬 게이지 바 그리기
   *
   * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
   * @param {number} x - 좌상단 X 좌표
   * @param {number} y - 좌상단 Y 좌표
   * @param {number} width - 게이지 바 너비
   * @param {number} height - 게이지 바 높이
   * @param {string} userId - 표시 주체 ('player' 또는 'ai')
   */
export function renderSkillGauge(ctx, x, y, width = 120, height = 12, userId = "player") {
  const manager = getSkillManager(userId);
  const gauge = manager.getGauge();
  const isMax = manager.isGaugeFull();

  // 배경
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(x, y, width, height);

  // 테두리
  ctx.strokeStyle = isMax ? "#FFD700" : "#666";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  // 게이지 채움
  const fillWidth = (gauge / GAUGE_MAX) * (width - 4);
  if (fillWidth > 0) {
    // 그라데이션 생성
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    if (isMax) {
      // MAX일 때 골드 그라데이션 + 글로우 효과
      gradient.addColorStop(0, "#FFD700");
      gradient.addColorStop(0.5, "#FFA500");
      gradient.addColorStop(1, "#FFD700");

      // 글로우 효과
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 10;
    } else {
      // 일반 그라데이션 (파랑 → 복숭아)
      gradient.addColorStop(0, "#4A90D9");
      gradient.addColorStop(1, "#5BC0BE");
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(x + 2, y + 2, fillWidth, height - 4);
    ctx.shadowBlur = 0;
  }

  // 퍼센트 텍스트
  ctx.fillStyle = "#FFF";
  ctx.font = `bold ${Math.floor(height * 0.8)}px "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${Math.floor(gauge)}%`, x + width / 2, y + height / 2);
}

/**
   * 스킬 아이콘 렌더링
   * [v5.0.0] 3개 스킬 아이콘 그리기
   *
   * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
   * @param {number} x - 좌상단 X 좌표
   * @param {number} y - 좌상단 Y 좌표
   * @param {string} userId - 표시 주체 ('player' 또는 'ai')
   */
export function renderSkillIcons(ctx, x, y, userId = "player") {
  const manager = getSkillManager(userId);
  const isAvailable = manager.isGaugeFull();
  const configs = getAllSkillConfigs();

  const iconSize = 40;
  const gap = 10;

  // 스킬 순서: 블라인드(1), 블록 스왑(2), 가비지 반사(3)
  const skillOrder = [SkillType.BLIND, SkillType.BLOCK_SWAP, SkillType.GARBAGE_REFLECT];
  const skillColors = {
    [SkillType.BLIND]: { bg: "#4A148C", icon: "#E1BEE7" },        // 복숭아
    [SkillType.BLOCK_SWAP]: { bg: "#1A237E", icon: "#BBDEFB" },   // 파랑
    [SkillType.GARBAGE_REFLECT]: { bg: "#B71C1C", icon: "#FFCDD2" }, // 빨강
  };

  skillOrder.forEach((skillType, index) => {
    const config = configs[skillType];
    const iconX = x + index * (iconSize + gap);
    const colors = skillColors[skillType];

    // 아이콘 배경
    if (isAvailable) {
      // 사용 가능: 밝은 색상 + 글로우
      ctx.fillStyle = colors.bg;
      ctx.shadowColor = colors.bg;
      ctx.shadowBlur = 15;
    } else {
      // 사용 불가: 어두운 회색
      ctx.fillStyle = "#444";
      ctx.shadowBlur = 0;
    }

    ctx.fillRect(iconX, y, iconSize, iconSize);
    ctx.shadowBlur = 0;

    // 테두리
    ctx.strokeStyle = isAvailable ? colors.icon : "#666";
    ctx.lineWidth = 2;
    ctx.strokeRect(iconX, y, iconSize, iconSize);

    // 아이콘 그리기 (간단한 기호)
    ctx.fillStyle = isAvailable ? colors.icon : "#888";
    ctx.font = `bold 20px "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 스킬별 아이콘
    let icon = "?";
    switch (skillType) {
      case SkillType.BLIND:
        icon = "👁";  // 눈
        break;
      case SkillType.BLOCK_SWAP:
        icon = "⇄";  // 교환 화살표
        break;
      case SkillType.GARBAGE_REFLECT:
        icon = "🛡";  // 방패
        break;
    }
    ctx.fillText(icon, iconX + iconSize / 2, y + iconSize / 2 - 3);

    // 키 바인딩 텍스트
    ctx.fillStyle = isAvailable ? "#FFF" : "#888";
    ctx.font = `bold 10px "Segoe UI", sans-serif`;
    ctx.fillText(config.key, iconX + iconSize / 2, y + iconSize - 8);
  });
}

/**
   * 블라인드 효과 렌더링
   * [v5.0.0] 블라인드 시 안개 효과 그리기
   *
   * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
   * @param {number} x - 보드 X 좌표
   * @param {number} y - 보드 Y 좌표
   * @param {number} width - 보드 너비
   * @param {number} height - 보드 높이
   * @param {number} opacity - 투명도 (0-1)
   */
export function renderBlindEffect(ctx, x, y, width, height, opacity = 0.85) {
  // 반투명 검은 오버레이
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
  ctx.fillRect(x, y, width, height);

  // 물음무늬 패턴
  ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.3})`;
  ctx.font = `bold 30px "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const cols = 5;
  const rows = 10;
  const cellW = width / cols;
  const cellH = height / rows;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = x + col * cellW + cellW / 2;
      const cy = y + row * cellH + cellH / 2;
      ctx.fillText("?", cx, cy);
    }
  }
}

/**
   * 가비지 반사 효과 렌더링
   * [v5.0.0] 쉴드 효과 그리기
   *
   * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
   * @param {number} x - 보드 X 좌표
   * @param {number} y - 보드 Y 좌표
   * @param {number} width - 보드 너비
   * @param {number} height - 보드 높이
   * @param {number} time - 현재 시간 (애니메이션용)
   */
export function renderGarbageReflectEffect(ctx, x, y, width, height, time) {
  // 쉴드 글로우
  const pulse = Math.sin(time * 0.01) * 0.3 + 0.7;
  ctx.strokeStyle = `rgba(0, 200, 255, ${pulse})`;
  ctx.lineWidth = 4;
  ctx.shadowColor = "#00C8FF";
  ctx.shadowBlur = 20 * pulse;

  // 보드 주변 쉴드 테두리
  ctx.strokeRect(x - 5, y - 5, width + 10, height + 10);
  ctx.shadowBlur = 0;

  // 쉴드 텍스트
  ctx.fillStyle = `rgba(0, 200, 255, ${pulse})`;
  ctx.font = `bold 14px "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("REFLECT", x + width / 2, y - 12);
}

/**
   * 스왑 애니메이션 렌더링
   * [v5.0.0] 블록 스왑 시 플래시 효과 그리기
   *
   * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
   * @param {number} x - 보드 X 좌표
   * @param {number} y - 보드 Y 좌표
   * @param {number} cellSize - 셀 크기
   * @param {string} userId - 표시 주체
   */
export function renderSwapAnimation(ctx, x, y, cellSize, userId = "player") {
  const manager = getSkillManager(userId);
  const anim = manager.swapAnimation;

  if (!anim.active) return;

  const elapsed = performance.now() - anim.startTime;
  const progress = Math.min(elapsed / anim.duration, 1);

  // 플래시 효과 (시작과 끝에서 밝게)
  const flashIntensity = progress < 0.5
    ? progress * 2
    : (1 - progress) * 2;

  // 스왑된 열에 플래시 효과
  ctx.fillStyle = `rgba(255, 255, 100, ${flashIntensity * 0.5})`;

  for (const [col1, col2] of anim.swapPairs) {
    // 첫 번째 열
    ctx.fillRect(x + col1 * cellSize, y, cellSize, 20 * cellSize);
    // 두 번째 열
    ctx.fillRect(x + col2 * cellSize, y, cellSize, 20 * cellSize);
  }
}
