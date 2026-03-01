/*
 * [v3.7.0] 모바일 터치 입력 처리
 *
 * 변경사항:
 *   - 반복 속도와 입력 계측, 숨김 QA 패널 연동
 *   - 입력 차단 상태와 홀드 액션 상태 전달 지원
 */

const HOLD_ACTIONS = new Set(["left", "right", "softDrop", "rotate", "hold"]);

export function installTouch(dispatch, options = {}) {
  const root = document.getElementById("mobileControls");
  if (!root) return;
  const {
    isHapticsEnabled = () => false,
    getHapticLevel = () => "normal",
    getRepeatInterval = () => 75,
    isInputBlocked = () => false,
    onTouchDebug = () => {},
    onInputMetric = () => {},
    onHeldActionChange = () => {},
  } = options;

  const begin = (action) => dispatch("player", action);
  const pulse = (action) => {
    if (!isHapticsEnabled() || typeof navigator.vibrate !== "function") return;
    const level = getHapticLevel();
    const patterns = {
      low: {
        hardDrop: 12,
        hold: 8,
        rotate: 8,
        skill: [10, 18, 10],
        default: 6,
      },
      normal: {
        hardDrop: 18,
        hold: 10,
        rotate: 10,
        skill: [12, 24, 12],
        default: 8,
      },
      strong: {
        hardDrop: 24,
        hold: 14,
        rotate: 14,
        skill: [18, 28, 18],
        default: 10,
      },
    };
    const patternSet = patterns[level] || patterns.normal;
    if (action === "hardDrop") {
      navigator.vibrate(patternSet.hardDrop);
      return;
    }
    if (action === "hold" || action === "rotate") {
      navigator.vibrate(patternSet[action]);
      return;
    }
    if (action === "skill1" || action === "skill2" || action === "skill3") {
      navigator.vibrate(patternSet.skill);
      return;
    }
    navigator.vibrate(patternSet.default);
  };

  root.querySelectorAll("button").forEach((btn) => {
    const action = btn.dataset.action;
    let repeatTimer = null;

    const shouldRepeat = action === "left" || action === "right" || action === "softDrop";

    const start = (e) => {
      e.preventDefault();
      if (isInputBlocked()) {
        onInputMetric("blocked", action, { source: "touch" });
        return;
      }
      pulse(action);
      onTouchDebug("start", action);
      onInputMetric("press", action, { source: "touch" });
      if (HOLD_ACTIONS.has(action)) {
        onHeldActionChange(action === "rotate" ? "rotateCW" : action, true);
      }
      if (shouldRepeat) {
        begin(action);
        repeatTimer = setInterval(() => {
          if (isInputBlocked()) return;
          begin(action);
          onTouchDebug("repeat", action);
          onInputMetric("repeat", action, { source: "touch" });
        }, Number(getRepeatInterval(action)) || 75);
        return;
      }
      begin(action);
    };

    const end = () => {
      if (repeatTimer) clearInterval(repeatTimer);
      repeatTimer = null;
      if (HOLD_ACTIONS.has(action)) {
        onHeldActionChange(action === "rotate" ? "rotateCW" : action, false);
      }
      onTouchDebug("end", action);
      onInputMetric("release", action, { source: "touch" });
    };

    if (window.PointerEvent) {
      btn.addEventListener("pointerdown", start);
      btn.addEventListener("pointerup", end);
      btn.addEventListener("pointercancel", end);
      btn.addEventListener("pointerleave", end);
    } else {
      btn.addEventListener("touchstart", start, { passive: false });
      btn.addEventListener("touchend", end);
      btn.addEventListener("touchcancel", end);
    }
  });
}
