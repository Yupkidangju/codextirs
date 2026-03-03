/*
 * [v3.18.2] 공용 게임 세션 부트스트랩
 *
 * 변경사항:
 *   - 데스크톱/모바일 셸이 공통으로 쓰는 게임 세션 조립 계층을 분리했다.
 *   - AudioEngine, BackgroundFx, ScreenImpact, createGame 초기화를 한 곳에서 묶는다.
 *   - 이후 모바일 셸이 main.js 전체 대신 이 계층을 기준으로 상태 어댑터를 붙일 수 있게 한다.
 */

import { createGame } from "../game/core/engine.js";
import { AudioEngine } from "../audio/midi_player.js";
import { BackgroundFx } from "../render/background.js";
import { ScreenImpact } from "../render/effects.js";

/**
 * 공용 게임 세션 생성
 * @param {object} config - 게임 세션 설정
 * @param {HTMLCanvasElement} config.playerCanvas - 플레이어 보드 캔버스
 * @param {HTMLCanvasElement} config.aiCanvas - AI 보드 캔버스
 * @param {HTMLCanvasElement} config.bgFxCanvas - 배경 효과 캔버스
 * @param {Function} config.onHud - HUD 갱신 콜백
 * @param {Function} config.onEvent - 게임 이벤트 콜백
 * @param {Function} config.getInputTuning - 입력 튜닝 조회 함수
 * @param {HTMLElement} [config.impactRoot=document.documentElement] - 화면 임팩트 기준 요소
 * @returns {{audio: AudioEngine, bgFx: BackgroundFx|object, impact: ScreenImpact, game: object}}
 */
export function createGameSession(config) {
  const {
    playerCanvas,
    aiCanvas,
    bgFxCanvas,
    onHud,
    onEvent,
    getInputTuning,
    impactRoot = document.documentElement,
  } = config;

  const audio = new AudioEngine();
  const bgFx = bgFxCanvas
    ? new BackgroundFx(bgFxCanvas)
    : { resize() {}, tick() {}, draw() {} };
  const impact = new ScreenImpact(impactRoot);
  const game = createGame({
    playerCanvas,
    aiCanvas,
    onHud,
    onEvent,
    getInputTuning,
  });

  return {
    audio,
    bgFx,
    impact,
    game,
  };
}
