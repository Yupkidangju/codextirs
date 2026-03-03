/*
 * [v3.18.6] 공용 오버레이 상태 컨트롤러
 *
 * 변경사항:
 *   - 브리핑/설정/결과 오버레이의 상태 전이와 일시정지 연계를 main.js에서 분리했다.
 *   - 오버레이 표시 렌더는 overlay_view를 재사용하고, 게임/오디오 상태 전이만 이 컨트롤러가 조정한다.
 *   - 모바일 셸이 별도 페이지를 쓰더라도 같은 오버레이 상태 머신을 공유할 수 있게 한다.
 */

import {
  renderBriefingStepView,
  renderResultOverlayView,
  setOverlayVisibility,
  syncRecentBattleCardView,
} from "./overlay_view.js";

export function createOverlayController(config) {
  let briefingPausedGame = false;
  let settingsPausedGame = false;
  let briefingStepIndex = 0;

  function canPauseRunningGame() {
    return !!config.hasStarted()
      && config.game()?.isRunning?.()
      && !config.game()?.isGameOver?.();
  }

  function renderBriefingStep() {
    const steps = config.briefingSteps || [];
    const step = steps[briefingStepIndex];
    if (!step) return;
    renderBriefingStepView({
      step,
      stepIndex: briefingStepIndex,
      totalSteps: steps.length,
      elements: config.briefingElements,
    });
  }

  function openBriefing(force = false) {
    const overlay = config.briefingElements?.briefingOverlay;
    if (!overlay) return;
    if (!force && document.body.classList.contains("briefing-open")) return;

    briefingPausedGame = canPauseRunningGame();
    if (briefingPausedGame) {
      config.game()?.pause?.();
      config.audio()?.stopBgm?.();
    }

    briefingStepIndex = 0;
    renderBriefingStep();
    setOverlayVisibility(overlay, "briefing-open", true);
    config.syncRotateHint?.();
  }

  function closeBriefing(markSeen = true) {
    const overlay = config.briefingElements?.briefingOverlay;
    if (!overlay) return;

    setOverlayVisibility(overlay, "briefing-open", false);
    if (markSeen) {
      config.markBriefingSeen?.();
    }
    if (briefingPausedGame && config.hasStarted() && !config.game()?.isGameOver?.()) {
      config.game()?.pause?.();
      if (!config.audio()?.muted) {
        config.audio()?.setBGMState?.(config.audio()?.getBGMState?.(), true);
      }
    }
    briefingPausedGame = false;
    config.syncRotateHint?.();
  }

  function advanceBriefing() {
    const steps = config.briefingSteps || [];
    if (briefingStepIndex >= steps.length - 1) {
      closeBriefing(true);
      if (!config.hasStarted() && !config.isStarting?.() && !config.startScreen()?.classList.contains("hidden")) {
        config.beginBattle?.();
      }
      return;
    }
    briefingStepIndex += 1;
    renderBriefingStep();
  }

  function openSettings() {
    const overlay = config.settingsElements?.settingsOverlay;
    if (!overlay) return;
    if (document.body.classList.contains("briefing-open")) return;
    config.endRebindCapture?.();

    settingsPausedGame = canPauseRunningGame();
    if (settingsPausedGame) {
      config.game()?.pause?.();
      config.audio()?.stopBgm?.();
    }

    config.applyUiSettings?.();
    setOverlayVisibility(overlay, "settings-open", true);
    config.syncRotateHint?.();
  }

  function closeSettings() {
    const overlay = config.settingsElements?.settingsOverlay;
    if (!overlay) return;
    config.endRebindCapture?.();

    setOverlayVisibility(overlay, "settings-open", false);
    if (settingsPausedGame && config.hasStarted() && !config.game()?.isGameOver?.()) {
      config.game()?.pause?.();
      if (!config.audio()?.muted) {
        config.audio()?.setBGMState?.(config.audio()?.getBGMState?.(), true);
      }
    }
    settingsPausedGame = false;
    config.syncRotateHint?.();
  }

  function showResultOverlay(summary) {
    const overlay = config.resultElements?.resultOverlay;
    if (!overlay) return;
    renderResultOverlayView(summary, config.resultElements);
    setOverlayVisibility(overlay, "result-open", true);
    config.syncRotateHint?.();
  }

  function hideResultOverlay() {
    const overlay = config.resultElements?.resultOverlay;
    if (!overlay) return;
    setOverlayVisibility(overlay, "result-open", false);
    overlay.classList.remove("victory", "defeat");
    config.syncRotateHint?.();
  }

  function syncRecentBattleCard() {
    syncRecentBattleCardView({
      summary: config.loadRecentBattle?.(),
      hasStarted: config.hasStarted(),
      startScreen: config.startScreen?.(),
      elements: config.recentBattleElements,
    });
  }

  return {
    openBriefing,
    closeBriefing,
    advanceBriefing,
    openSettings,
    closeSettings,
    showResultOverlay,
    hideResultOverlay,
    syncRecentBattleCard,
    renderBriefingStep,
  };
}
