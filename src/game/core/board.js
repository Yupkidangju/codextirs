/*
 * [v3.10.0] 보드 로직
 * 
 * 작성일: 2026-02-28
 * 변경사항: 
 *   - 아이템 블록 지원 추가
 *   - 아이템 효과 처리 (Bomb, Star, Shield)
 *   - 아이템 포함 블록 병합 기능
 *   - 라인 파괴 연출용 클리어 줄 인덱스 노출
 *   - [v3.10.0] 패턴 공격 문법용 표면/클리어 형태 분석 추가
 */

import { BOARD_WIDTH, BOARD_HEIGHT, TSPIN_CHECK_POINTS } from "./constants.js";
import { PIECES } from "./pieces.js";
import { createItemBlockValue, getItemType, getBasePieceType } from "./items.js";

/**
 * 보드 클래스
 */
export class Board {
  constructor() {
    this.width = BOARD_WIDTH;
    this.height = BOARD_HEIGHT;
    this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(0));
  }

  /**
   * 보드 초기화
   */
  reset() {
    this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(0));
  }

  /**
   * 충돌 검사
   * @param {string} pieceKey - 블록 종류 (I, O, T, S, Z, J, L)
   * @param {number} rot - 회전 상태 (0-3)
   * @param {number} x - X 좌표
   * @param {number} y - Y 좌표
   * @returns {boolean} 충돌 여부
   */
  collides(pieceKey, rot, x, y) {
    const shape = PIECES[pieceKey].r[rot % PIECES[pieceKey].r.length];
    for (let py = 0; py < shape.length; py++) {
      for (let px = 0; px < shape[py].length; px++) {
        if (!shape[py][px]) continue;
        const gx = x + px;
        const gy = y + py;
        if (gx < 0 || gx >= this.width || gy >= this.height) return true;
        if (gy >= 0 && this.grid[gy][gx]) return true;
      }
    }
    return false;
  }

  /**
   * 블록 병합 (고정)
   * [v2.1.0] 아이템 블록 지원 추가
   * @param {string} pieceKey - 블록 종류
   * @param {number} rot - 회전 상태
   * @param {number} x - X 좌표
   * @param {number} y - Y 좌표
   * @param {Object} itemInfo - 아이템 정보 (optional) { itemType, itemPos }
   * @returns {boolean} 성공 여부
   */
  merge(pieceKey, rot, x, y, itemInfo = null) {
    const shape = PIECES[pieceKey].r[rot % PIECES[pieceKey].r.length];
    for (let py = 0; py < shape.length; py++) {
      for (let px = 0; px < shape[py].length; px++) {
        if (!shape[py][px]) continue;
        const gx = x + px;
        const gy = y + py;
        if (gy < 0) return false;  // 게임 오버 (Top out)
        
        // [v2.1.0] 아이템 블록인지 확인
        let blockValue = pieceKey;
        if (itemInfo && itemInfo.itemType && itemInfo.itemPos) {
          // 회전된 좌표 계산
          const rotatedPos = this._getRotatedPosition(px, py, pieceKey, rot);
          if (rotatedPos.x === itemInfo.itemPos.x && rotatedPos.y === itemInfo.itemPos.y) {
            blockValue = createItemBlockValue(pieceKey, itemInfo.itemType);
          }
        }
        
        this.grid[gy][gx] = blockValue;
      }
    }
    return true;
  }

  /**
   * 회전된 좌표 계산 (아이템 위치용)
   * [v2.1.0] 회전 상태에 따른 로컬 좌표 변환
   * @param {number} px - 원본 X
   * @param {number} py - 원본 Y
   * @param {string} pieceKey - 조각 종류
   * @param {number} rot - 회전 상태
   * @returns {Object} 회전된 좌표 {x, y}
   */
  _getRotatedPosition(px, py, pieceKey, rot) {
    const shape = PIECES[pieceKey].r[rot % PIECES[pieceKey].r.length];
    const h = shape.length;
    const w = shape[0].length;
    
    // 회전 상태에 따른 좌표 변환 (역변환)
    switch (rot % 4) {
      case 0: return { x: px, y: py };
      case 1: return { x: py, y: w - 1 - px };
      case 2: return { x: w - 1 - px, y: h - 1 - py };
      case 3: return { x: h - 1 - py, y: px };
    }
    return { x: px, y: py };
  }

  /**
   * 라인 클리어
   * [v2.1.0] 아이템 효과 처리 추가
   * @returns {Object} 클리어 결과 { lines: number, itemBlocks: Array, clearedLines: Array }
   */
  clearLines() {
    let cleared = 0;
    const next = [];
    const clearedLines = [];  // 클리어된 줄 인덱스
    
    for (let y = 0; y < this.height; y++) {
      if (this.grid[y].every((v) => v !== 0)) {
        cleared++;
        clearedLines.push(y);
      } else {
        next.push([...this.grid[y]]);
      }
    }
    
    // [v2.1.0] 클리어된 줄의 아이템 블록 수집
    const itemBlocks = this._collectItemBlocks(clearedLines);
    
    // 위쪽에 빈 라인 추가
    while (next.length < this.height) {
      next.unshift(Array(this.width).fill(0));
    }
    
    this.grid = next;
    
    return {
      lines: cleared,
      itemBlocks: itemBlocks,
      clearedLines,
    };
  }

  /**
   * 클리어된 줄에서 아이템 블록 수집
   * [v2.1.0] 클리어할 때 활성화될 아이템 블록 목록 반환
   * @param {Array} clearedLines - 클리어된 줄 인덱스 목록
   * @returns {Array} 아이템 블록 목록 [{x, y, itemType, basePiece}, ...]
   */
  _collectItemBlocks(clearedLines) {
    const itemBlocks = [];
    
    for (const y of clearedLines) {
      for (let x = 0; x < this.width; x++) {
        const blockValue = this.grid[y][x];
        if (blockValue && typeof blockValue === "string") {
          const itemType = getItemType(blockValue);
          if (itemType) {
            itemBlocks.push({
              x,
              y,
              itemType,
              basePiece: getBasePieceType(blockValue),
            });
          }
        }
      }
    }
    
    return itemBlocks;
  }

  /**
   * 퍼펙트 클리어 체크
   * @returns {boolean} 퍼펙트 클리어 여부
   */
  isPerfectClear() {
    return this.grid.every(row => row.every(cell => cell === 0));
  }

  /**
   * 가비지 라인 푸시
   * @param {number} lines - 푸시할 라인 수
   * @param {number} holeX - 구멍 위치 (0-9, -1이면 랜덤)
   */
  pushGarbage(lines, holeX = -1) {
    for (let i = 0; i < lines; i++) {
      this.grid.shift();  // 위에서 한 줄 제거
      const newLine = Array(this.width).fill('G');  // 'G' = Garbage
      const hole = holeX >= 0 ? holeX : Math.floor(Math.random() * this.width);
      newLine[hole] = 0;  // 구멍 생성
      this.grid.push(newLine);
    }
  }

  /**
   * 고스트 블록 Y 위치 계산
   * @param {string} pieceKey - 블록 종류
   * @param {number} rot - 회전 상태
   * @param {number} x - X 좌표
   * @param {number} currentY - 현재 Y 좌표
   * @returns {number} 고스트 블록의 Y 좌표
   */
  getGhostY(pieceKey, rot, x, currentY) {
    let ghostY = currentY;
    
    // 바닥이나 다른 블록에 닿을 때까지 낙하
    while (!this.collides(pieceKey, rot, x, ghostY + 1)) {
      ghostY++;
    }
    
    return ghostY;
  }

  /**
   * 현재 스택 높이 계산
   * @returns {number} 바닥 기준 높이 (0-20)
   */
  getStackHeight() {
    for (let y = 0; y < this.height; y++) {
      if (this.grid[y].some((cell) => cell !== 0)) {
        return this.height - y;
      }
    }
    return 0;
  }

  /**
   * T-스핀 체크 (SRS 기준)
   * @param {string} pieceKey - 블록 종류 (반드시 'T'여야 함)
   * @param {number} rot - 회전 상태
   * @param {number} x - X 좌표
   * @param {number} y - Y 좌표
   * @param {boolean} lastMoveWasKick - 마지막 이동이 킥이었는지
   * @returns {string|null} 'mini' | 'tspin' | null
   */
  checkTSpin(pieceKey, rot, x, y, lastMoveWasKick) {
    if (pieceKey !== 'T') return null;
    
    // T-스핀 포인트 체크 (4개 모서리)
    const corners = [];
    for (const [dx, dy] of TSPIN_CHECK_POINTS) {
      const gx = x + 1 + dx;  // T 블록 중심 기준
      const gy = y + 1 + dy;
      
      // 벽이나 블록이 있으면 true
      const isBlocked = gy >= this.height || 
                        gx < 0 || 
                        gx >= this.width || 
                        (gy >= 0 && this.grid[gy][gx] !== 0);
      corners.push(isBlocked);
    }
    
    // 3개 이상의 코너가 막혀있어야 T-스핀
    const blockedCount = corners.filter(Boolean).length;
    if (blockedCount < 3) return null;
    
    // 전방 2개 코너 확인 (회전 상태에 따라 다름)
    let frontCorners;
    switch (rot % 4) {
      case 0: frontCorners = [0, 1]; break;  // 상단 좌우
      case 1: frontCorners = [1, 3]; break;  // 우측 상하
      case 2: frontCorners = [2, 3]; break;  // 하단 좌우
      case 3: frontCorners = [0, 2]; break;  // 좌측 상하
    }
    
    const frontBlocked = frontCorners.every(i => corners[i]);
    
    // T-스핀 미니: 킥으로 이루어졌고, 전방이 둘 다 막히지 않은 경우
    if (lastMoveWasKick && !frontBlocked) {
      return 'mini';
    }
    
    // 일반 T-스핀: 전방이 둘 다 막힘
    if (frontBlocked) {
      // 라인 클리어 수 기반 세부 타입은 엔진에서 결정
      return 'tspin';
    }
    
    return null;
  }

  /**
   * 슈퍼 로테이션 시스템 (SRS) - 벽킥 테이블
   * @param {string} pieceKey - 블록 종류
   * @param {number} fromRot - 현재 회전
   * @param {number} toRot - 목표 회전
   * @param {number} x - 현재 X
   * @param {number} y - 현재 Y
   * @returns {Array|null} [newX, newY] 또는 null
   */
  tryWallKick(pieceKey, fromRot, toRot, x, y) {
    // I 블록용 킥 테이블
    const iKicks = [
      [[0,0], [-2,0], [1,0], [-2,-1], [1,2]],   // 0→1
      [[0,0], [-1,0], [2,0], [-1,2], [2,-1]],   // 1→0
      [[0,0], [2,0], [-1,0], [2,1], [-1,-2]],   // 1→2
      [[0,0], [1,0], [-2,0], [1,-2], [-2,1]],   // 2→1
      [[0,0], [-2,0], [1,0], [-2,-1], [1,2]],   // 2→3
      [[0,0], [-1,0], [2,0], [-1,2], [2,-1]],   // 3→2
      [[0,0], [2,0], [-1,0], [2,1], [-1,-2]],   // 3→0
      [[0,0], [1,0], [-2,0], [1,-2], [-2,1]],   // 0→3
    ];
    
    // JLSTZ 블록용 킥 테이블
    const jlstzKicks = [
      [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],  // 0→1
      [[0,0], [1,0], [1,-1], [0,2], [1,2]],      // 1→0
      [[0,0], [1,0], [1,-1], [0,2], [1,2]],      // 1→2
      [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],  // 2→1
      [[0,0], [1,0], [1,1], [0,-2], [1,-2]],     // 2→3
      [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],   // 3→2
      [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],   // 3→0
      [[0,0], [1,0], [1,1], [0,-2], [1,-2]],     // 0→3
    ];
    
    // O 블록은 킥 없음
    if (pieceKey === 'O') return null;
    
    // 회전 방향 계산
    const isClockwise = (toRot - fromRot + 4) % 4 === 1;
    const kickIndex = isClockwise ? fromRot * 2 : (fromRot * 2 + 7) % 8;
    
    // 블록 종류에 따른 킥 테이블 선택
    const kicks = pieceKey === 'I' ? iKicks : jlstzKicks;
    const testKicks = kicks[kickIndex];
    
    // 각 킥 테스트
    for (const [dx, dy] of testKicks) {
      const newX = x + dx;
      const newY = y - dy;  // Y는 반대 방향
      
      if (!this.collides(pieceKey, toRot, newX, newY)) {
        return [newX, newY];
      }
    }
    
    return null;
  }

  /**
   * 보드 깊은 복사
   * @returns {Array} 복사된 그리드
   */
  cloneGrid() {
    return this.grid.map(row => [...row]);
  }

  /**
   * 특정 셀들 제거 (아이템 효과용)
   * [v2.1.0] 폭탄/별 아이템으로 파괴된 셀들을 제거하고 블록들을 아래로 내림
   * @param {Array} cells - 제거할 셀 목록 [{x, y}, ...]
   */
  clearCells(cells) {
    if (!cells || cells.length === 0) return;

    // 중복 제거
    const uniqueCells = [];
    const seen = new Set();
    for (const cell of cells) {
      const key = `${cell.x},${cell.y}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCells.push(cell);
      }
    }

    // 각 열(column)별로 처리
    for (let x = 0; x < this.width; x++) {
      // 이 열에서 제거할 행들 수집
      const rowsToClear = uniqueCells
        .filter(c => c.x === x)
        .map(c => c.y)
        .sort((a, b) => b - a); // 내림차순 (위에서부터)

      if (rowsToClear.length === 0) continue;

      // 해당 열의 모든 값 수집 (제거할 행 제외)
      const colValues = [];
      for (let y = 0; y < this.height; y++) {
        if (!rowsToClear.includes(y)) {
          colValues.push(this.grid[y][x]);
        }
      }

      // 위쪽에 0 채우기
      while (colValues.length < this.height) {
        colValues.unshift(0);
      }

      // 열 업데이트
      for (let y = 0; y < this.height; y++) {
        this.grid[y][x] = colValues[y];
      }
    }
  }

  /**
   * 특정 줄 전체 제거 (별 아이템용)
   * [v2.1.0] 지정된 y좌표의 줄 전체를 즉시 제거
   * @param {number} y - 제거할 줄의 y좌표
   */
  clearRow(y) {
    if (y < 0 || y >= this.height) return;

    // 해당 줄 제거
    this.grid.splice(y, 1);
    // 위쪽에 새 빈 줄 추가
    this.grid.unshift(Array(this.width).fill(0));
  }

  /**
   * 라인 클리어 패턴 분석
   * [v3.10.0] 보드 표면과 조각 문맥을 이용해 패턴 공격 태그를 산출한다.
   *
   * @param {Object} options - 분석 옵션
   * @returns {Object|null} 패턴 정보
   */
  analyzeLinePattern(options = {}) {
    const {
      preGrid,
      pieceKey,
      rot = 0,
      x = 0,
      lines = 0,
      tSpinType = null,
      isPerfectClear = false,
    } = options;

    if (isPerfectClear) {
      return { tag: "nullBurst", attackType: "NullBurst", label: "NULL BURST", tone: "gold" };
    }

    if (tSpinType) {
      return { tag: "drillHex", attackType: "DrillHex", label: "DRILL HEX", tone: "gold" };
    }

    if (!preGrid || lines <= 0) return null;

    const heights = this._getColumnHeightsFromGrid(preGrid);
    const stackHeight = this._getStackHeightFromGrid(preGrid);

    if (lines >= 4 && pieceKey === "I" && rot % 2 === 1 && x >= 3 && x <= 5) {
      return { tag: "pierceBarrage", attackType: "PierceBarrage", label: "PIERCE BARRAGE", tone: "gold" };
    }

    if (lines >= 2 && this._isStaircaseProfile(heights)) {
      return { tag: "wavePush", attackType: "WavePush", label: "WAVE PUSH", tone: "warn" };
    }

    if (stackHeight <= 6) {
      return { tag: "stabilityShield", attackType: null, label: "STABILITY SHIELD", tone: "buff" };
    }

    return null;
  }

  /**
   * 열별 스택 높이 계산
   * @param {Array<Array>} grid - 대상 그리드
   * @returns {number[]} 열별 높이 목록
   */
  _getColumnHeightsFromGrid(grid) {
    return Array.from({ length: this.width }, (_, x) => {
      for (let y = 0; y < this.height; y++) {
        if (grid[y][x] !== 0) {
          return this.height - y;
        }
      }
      return 0;
    });
  }

  /**
   * 주어진 그리드의 스택 최대 높이 계산
   * @param {Array<Array>} grid - 대상 그리드
   * @returns {number} 스택 높이
   */
  _getStackHeightFromGrid(grid) {
    for (let y = 0; y < this.height; y++) {
      if (grid[y].some((cell) => cell !== 0)) {
        return this.height - y;
      }
    }
    return 0;
  }

  /**
   * 계단형 표면 여부 판정
   * [v3.10.0] 1~2칸 차이의 잦은 오르내림이 많은 표면을 계단형으로 본다.
   *
   * @param {number[]} heights - 열별 높이
   * @returns {boolean} 계단형 여부
   */
  _isStaircaseProfile(heights) {
    let transitions = 0;
    let rising = 0;
    let falling = 0;

    for (let i = 1; i < heights.length; i++) {
      const diff = heights[i] - heights[i - 1];
      if (diff === 0 || Math.abs(diff) > 2) continue;
      transitions++;
      if (diff > 0) {
        rising++;
      } else {
        falling++;
      }
    }

    return transitions >= 4 && rising >= 2 && falling >= 2;
  }
}
