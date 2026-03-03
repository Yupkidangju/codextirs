/*
 * [v3.18.3] 공용 HUD 렌더러
 *
 * 변경사항:
 *   - 점수/레벨/게이지/보스/모바일 상태바 갱신을 main.js에서 분리했다.
 *   - STATUS/INCOMING 위젯 렌더링을 공용 UI 계층으로 이동했다.
 *   - 모바일 셸과 데스크톱 셸이 같은 HUD 렌더 함수를 공유할 수 있게 정리했다.
 */

function formatRemainingTime(seconds) {
  return `${Math.max(0.1, seconds).toFixed(seconds >= 10 ? 0 : 1)}s`;
}

export function getIncomingAttackLabel(type) {
  const labels = {
    GarbagePush: "GARBAGE",
    CorruptNext: "CORRUPT",
    GravityJolt: "JOLT",
    StackShake: "STAGGER",
    Darkness: "DARK",
    MirrorMove: "MIRROR",
    HoldLock: "HOLD LOCK",
    GhostOut: "GHOST OFF",
    RotationTax: "ROT TAX",
    GaugeLeech: "LEECH",
    NextScramble: "SCRAMBLE",
    PierceBarrage: "PIERCE",
    DrillHex: "DRILL HEX",
    WavePush: "WAVE PUSH",
    NullBurst: "NULL BURST",
  };
  return labels[type] || String(type || "UNKNOWN").toUpperCase();
}

export function syncAudioStatusView(audio, elements) {
  const {
    bgmStateValue,
    trackNameValue,
    musicDriveValue,
    bossLayerValue,
  } = elements;

  if (bgmStateValue) {
    bgmStateValue.textContent = audio.getBGMState().toUpperCase();
  }
  if (trackNameValue) {
    trackNameValue.textContent = audio.getCurrentTrackName();
  }
  if (musicDriveValue) {
    musicDriveValue.textContent = audio.getMusicDriveLabel?.() || "CALM";
  }
  if (bossLayerValue) {
    bossLayerValue.textContent = audio.getBossLayerLabel?.() || "OFF";
  }
}

export function updatePrimaryHudView({
  pState,
  aState,
  selectedDifficulty,
  elements,
  skillManager,
  skillTypes,
  mobileSkillBtns = [],
}) {
  const {
    scoreValue,
    comboValue,
    levelValue,
    aiLevelValue,
    bossHpPanel,
    bossHpValue,
    bossHpFill,
    gaugeValue,
    specialGauge,
    mobileScore,
    mobileCombo,
    mobileLevel,
    mobileGaugeFill,
    skillBtn1,
    skillBtn2,
    skillBtn3,
  } = elements;

  const percent = Math.floor(pState.specialGauge);

  if (scoreValue) {
    scoreValue.textContent = pState.score.toLocaleString();
  }
  if (comboValue) {
    comboValue.textContent = `x${pState.combo}`;
    comboValue.classList.toggle("combo-active", pState.combo > 0);
  }
  if (levelValue) {
    levelValue.textContent = `Lv ${pState.level}`;
  }
  if (aiLevelValue) {
    aiLevelValue.textContent = aState.id === "ai" ? selectedDifficulty : "-";
  }
  if (bossHpPanel) {
    bossHpPanel.classList.toggle("hidden", !aState.bossModeEnabled);
  }
  if (bossHpValue) {
    bossHpValue.textContent = `${Math.max(0, Math.floor(aState.bossHp ?? 100))}%`;
  }
  if (bossHpFill) {
    bossHpFill.style.setProperty("--boss-hp-percent", `${Math.max(0, aState.bossHp ?? 100)}%`);
  }
  if (gaugeValue && specialGauge) {
    gaugeValue.textContent = `${percent}%`;
    specialGauge.style.setProperty("--gauge-percent", `${percent}%`);
    specialGauge.parentElement?.classList.toggle("gauge-max", !!pState.specialReady);
  }
  if (mobileScore) {
    mobileScore.textContent = pState.score.toLocaleString();
  }
  if (mobileCombo) {
    mobileCombo.textContent = `x${pState.combo}`;
  }
  if (mobileLevel) {
    mobileLevel.textContent = pState.level;
  }
  if (mobileGaugeFill) {
    mobileGaugeFill.style.setProperty("--gauge-percent", `${percent}%`);
  }

  const skillButtons = [skillBtn1, skillBtn2, skillBtn3, ...mobileSkillBtns];
  skillButtons.forEach((btn, index) => {
    if (!btn) return;
    const skillType = skillTypes[index % skillTypes.length];
    btn.disabled = !skillManager.canUseSkill(skillType);
  });
}

export function renderStatusEffectsView({
  container,
  countValue,
  hasStarted,
  playerState,
  isMobile,
  skillManager,
  feverStatus,
  nowMs,
}) {
  if (!container || !countValue) return;
  if (!hasStarted || !playerState) {
    countValue.textContent = "0";
    container.innerHTML = '<div class="status-empty">활성 상태 없음</div>';
    return;
  }

  const effects = [];

  if (feverStatus.active) {
    effects.push({ label: `FEVER ${feverStatus.label || "FORGE"}`, time: feverStatus.remainingTime, tone: "buff", priority: 105 });
  }
  const neonShiftRemain = ((playerState.neonShiftUntil || 0) - nowMs) / 1000;
  if (neonShiftRemain > 0) {
    effects.push({ label: "SHIFT", time: neonShiftRemain, tone: "neon", priority: 110 });
  }
  const blindRemain = ((skillManager.activeEffects?.blind?.endTime || 0) - nowMs) / 1000;
  if (blindRemain > 0) {
    effects.push({ label: "BLIND", time: blindRemain, tone: "debuff", priority: 85 });
  }
  const reflectRemain = ((skillManager.activeEffects?.garbageReflect?.endTime || 0) - nowMs) / 1000;
  if (reflectRemain > 0) {
    effects.push({ label: "REFLECT", time: reflectRemain, tone: "buff", priority: 70 });
  }

  const residueCount = Array.isArray(playerState.neonResidueRows)
    ? playerState.neonResidueRows.filter((entry) => (entry?.until || 0) > nowMs).length
    : 0;
  if (residueCount > 0) {
    effects.push({ label: `RESIDUE x${residueCount}`, time: 99, tone: "neon", priority: 60 });
  }
  const layerCounterRemain = ((playerState.layerCounterUntil || 0) - nowMs) / 1000;
  if (layerCounterRemain > 0) {
    effects.push({ label: playerState.layerCounterLabel || "COUNTER", time: layerCounterRemain, tone: "buff", priority: 97 });
  }
  const itemBoostRemain = ((playerState.neonItemBoostUntil || 0) - nowMs) / 1000;
  if (itemBoostRemain > 0) {
    effects.push({ label: "SURGE+", time: itemBoostRemain, tone: "buff", priority: 66 });
  }

  [
    ["DARK", (playerState.darknessUntil - nowMs) / 1000, "debuff", 98],
    ["MIRROR", (playerState.mirrorMoveUntil - nowMs) / 1000, "debuff", 96],
    ["CORRUPT", (playerState.corruptNextUntil - nowMs) / 1000, "warning", 78],
    ["JOLT", (playerState.gravityJoltUntil - nowMs) / 1000, "warning", 72],
    ["STAGGER", (playerState.inputDelayUntil - nowMs) / 1000, "warning", 92],
    ["HOLD LOCK", (playerState.holdLockUntil - nowMs) / 1000, "warning", 102],
    ["GHOST OFF", (playerState.ghostHiddenUntil - nowMs) / 1000, "debuff", 90],
    ["ROT TAX", (playerState.rotationTaxUntil - nowMs) / 1000, "warning", 100],
    ["LEECH", (playerState.gaugeLeechUntil - nowMs) / 1000, "warning", 94],
    ["SCRAMBLE", (playerState.nextScrambleUntil - nowMs) / 1000, "debuff", 88],
  ].forEach(([label, time, tone, priority]) => {
    if (time > 0) {
      effects.push({ label, time, tone, priority });
    }
  });

  effects.sort((a, b) => {
    if ((b.priority || 0) !== (a.priority || 0)) return (b.priority || 0) - (a.priority || 0);
    return (a.time || 0) - (b.time || 0);
  });

  countValue.textContent = String(effects.length);
  if (!effects.length) {
    container.innerHTML = '<div class="status-empty">활성 상태 없음</div>';
    return;
  }

  const maxVisibleEffects = isMobile ? 4 : 5;
  const visibleEffects = effects.slice(0, maxVisibleEffects);
  const hiddenCount = Math.max(0, effects.length - visibleEffects.length);
  container.innerHTML = visibleEffects
    .map(({ label, time, tone }) => (
      `<div class="status-chip ${tone}"><span class="status-name">${label}</span><span class="status-time">${formatRemainingTime(time)}</span></div>`
    ))
    .concat(hiddenCount > 0 ? [`<div class="status-chip meta"><span class="status-name">+${hiddenCount} MORE</span></div>`] : [])
    .join("");
}

export function renderIncomingPreviewView({
  valueEl,
  queueEl,
  hasStarted,
  pendingAttacks,
  isMobile,
}) {
  if (!valueEl || !queueEl) return;
  if (!hasStarted) {
    valueEl.textContent = "0";
    queueEl.innerHTML = '<div class="incoming-empty">위협 없음</div>';
    return;
  }

  const totalGarbage = pendingAttacks.reduce((sum, pending) => {
    if (pending.attackEvent?.type !== "GarbagePush") return sum;
    return sum + Math.max(0, pending.attackEvent?.strength || 0);
  }, 0);
  valueEl.textContent = String(totalGarbage);

  if (!pendingAttacks.length) {
    queueEl.innerHTML = '<div class="incoming-empty">위협 없음</div>';
    return;
  }

  const grouped = new Map();
  pendingAttacks.forEach((pending) => {
    const type = pending.attackEvent?.type || "Unknown";
    const strength = Math.max(0, pending.attackEvent?.strength || 0);
    const current = grouped.get(type) || {
      type,
      totalStrength: 0,
      count: 0,
      minRemainingMs: Number.POSITIVE_INFINITY,
    };
    current.totalStrength += strength;
    current.count += 1;
    current.minRemainingMs = Math.min(current.minRemainingMs, pending.remainingMs || 0);
    grouped.set(type, current);
  });

  const groupedAttacks = [...grouped.values()].sort((a, b) => {
    if (a.type === "GarbagePush" && b.type !== "GarbagePush") return -1;
    if (a.type !== "GarbagePush" && b.type === "GarbagePush") return 1;
    return a.minRemainingMs - b.minRemainingMs;
  });

  const maxVisibleIncoming = isMobile ? 3 : 4;
  const visibleIncoming = groupedAttacks.slice(0, maxVisibleIncoming);
  const hiddenCount = Math.max(0, groupedAttacks.length - visibleIncoming.length);
  queueEl.innerHTML = visibleIncoming
    .map((entry) => {
      const tone = entry.type === "GarbagePush" ? "garbage" : "special";
      const amountText = entry.type === "GarbagePush"
        ? ` +${entry.totalStrength}`
        : entry.count > 1
          ? ` x${entry.count}`
          : "";
      return `<div class="incoming-chip ${tone}"><span class="incoming-name">${getIncomingAttackLabel(entry.type)}${amountText}</span><span class="incoming-time">${formatRemainingTime(entry.minRemainingMs / 1000)}</span></div>`;
    })
    .concat(hiddenCount > 0 ? [`<div class="incoming-chip meta"><span class="incoming-name">+${hiddenCount} MORE</span></div>`] : [])
    .join("");
}
