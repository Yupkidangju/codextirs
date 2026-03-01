/*
 * [v2.1.0] 테트리스 조각 정의
 * 
 * 작성일: 2026-02-28
 * 변경사항: 
 *   - 아이템 블록 지원을 위한 구조 추가
 *   - spawnPieceWithItem 함수 추가
 */

import { spawnItemPiece } from "./items.js";

// ============================================================================
// 조각 정의
// ============================================================================

export const PIECES = {
  I: { color: "#00e5ff", r: [[[1,1,1,1]], [[1],[1],[1],[1]]] },
  O: { color: "#ffd54f", r: [[[1,1],[1,1]]] },
  T: { color: "#b388ff", r: [[[0,1,0],[1,1,1]], [[1,0],[1,1],[1,0]], [[1,1,1],[0,1,0]], [[0,1],[1,1],[0,1]]] },
  S: { color: "#69f0ae", r: [[[0,1,1],[1,1,0]], [[1,0],[1,1],[0,1]]] },
  Z: { color: "#ff8a80", r: [[[1,1,0],[0,1,1]], [[0,1],[1,1],[1,0]]] },
  J: { color: "#82b1ff", r: [[[1,0,0],[1,1,1]], [[1,1],[1,0],[1,0]], [[1,1,1],[0,0,1]], [[0,1],[0,1],[1,1]]] },
  L: { color: "#ffab40", r: [[[0,0,1],[1,1,1]], [[1,0],[1,0],[1,1]], [[1,1,1],[1,0,0]], [[1,1],[0,1],[0,1]]] },
};

export const PIECE_KEYS = Object.keys(PIECES);

// ============================================================================
// 아이템 포함 조각 생성
// ============================================================================

/**
 * 랜덤 조각 생성 (아이템 포함 가능)
 * [v2.1.0] 5% 확률로 아이템 블록이 포함된 조각 생성
 * @returns {Object} 조각 정보 객체
 *   - pieceKey: 조각 종류
 *   - hasItem: 아이템 포함 여부
 *   - itemType: 아이템 타입 (있는 경우)
 *   - itemPos: 아이템 위치 {x, y} (있는 경우)
 */
export function spawnPieceWithItem() {
  const pieceKey = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
  const itemPiece = spawnItemPiece(pieceKey);
  
  if (itemPiece) {
    return {
      pieceKey: itemPiece.pieceKey,
      hasItem: true,
      itemType: itemPiece.itemType,
      itemPos: itemPiece.itemPos,
    };
  }
  
  return {
    pieceKey,
    hasItem: false,
    itemType: null,
    itemPos: null,
  };
}

/**
 * 조각이 아이템 블록을 포함하는지 확인
 * [v2.1.0] spawnPieceWithItem 결과 검사
 * @param {Object} piece - 조각 객체
 * @returns {boolean} 아이템 포함 여부
 */
export function pieceHasItem(piece) {
  return piece && piece.hasItem === true && piece.itemType !== null;
}

/**
 * 조각의 특정 위치가 아이템 위치인지 확인
 * [v2.1.0] 로컬 좌표 기준 아이템 위치 검사
 * @param {Object} piece - 조각 객체
 * @param {number} localX - 조각 내 X 좌표
 * @param {number} localY - 조각 내 Y 좌표
 * @returns {boolean} 해당 위치가 아이템 위치인지 여부
 */
export function isItemPosition(piece, localX, localY) {
  if (!pieceHasItem(piece)) return false;
  
  return piece.itemPos.x === localX && piece.itemPos.y === localY;
}
