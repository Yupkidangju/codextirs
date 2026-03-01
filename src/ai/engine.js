import { PIECES } from "../game/core/pieces.js";
import { AI_LEVELS, getBossModeConfig } from "./levels.js";
import { setAIVoice, playVoiceLine, initVoiceSystem, playVoiceLineDebounced } from "./voice.js";

export class AIController {
  constructor(levelName, wasmMath) {
    this.levelName = levelName;
    this.baseCfg = AI_LEVELS[levelName] || AI_LEVELS["기사"];
    this.cfg = this.baseCfg;
    this.wasmMath = wasmMath;
    this.cooldown = 0;
    // [v2.0.1-fix] 스폰 직후 하드드롭 방지용
    this.lastPiece = null;
    this.spawnGraceTicks = 0;
    // [v2.1.0] 캐릭터 보이스 시스템 상태
    this.voiceInitialized = false;
    this.lastClearedLines = 0;
    this.comboCount = 0;
    this.lastComboTime = 0;
  }

  setLevel(name) {
    this.levelName = name;
    this.baseCfg = AI_LEVELS[name] || AI_LEVELS["기사"];
    this.cfg = this.baseCfg;
    // [v2.1.0] 레벨 변경 시 보이스 설정 업데이트
    this.initVoice();
  }

  setBossMode(active) {
    this.cfg = active ? getBossModeConfig(this.baseCfg) : this.baseCfg;
  }

  getConfig() {
    return this.cfg;
  }

  // [v2.1.0] 보이스 시스템 초기화
  initVoice() {
    if (!this.voiceInitialized) {
      initVoiceSystem(this.levelName);
      this.voiceInitialized = true;
    } else {
      setAIVoice(this.levelName);
    }
  }

  // [v2.1.0] 게임 시작 보이스
  playGameStartVoice() {
    this.initVoice();
    playVoiceLine("gameStart", { volume: this.cfg.voice?.voiceVolume || 0.3 });
  }

  // [v2.1.0] 라인 클리어 보이스
  playLineClearVoice(linesCleared) {
    if (linesCleared > this.lastClearedLines && linesCleared > 0) {
      playVoiceLineDebounced("lineClear", 300, { 
        volume: this.cfg.voice?.voiceVolume || 0.3 
      });
    }
    this.lastClearedLines = linesCleared;
  }

  // [v2.1.0] 가비지 전송 보이스
  playGarbageSendVoice(garbageLines) {
    if (garbageLines > 0) {
      playVoiceLineDebounced("garbageSend", 500, { 
        volume: (this.cfg.voice?.voiceVolume || 0.3) * 1.2 
      });
    }
  }

  // [v2.1.0] 콤보 보이스 (5+ 콤보 시)
  playComboVoice(comboCount) {
    const now = Date.now();
    // 콤보가 리셋된 후 3초 이내에 다시 콤보가 쌓이면 연속된 콤보로 간주
    if (now - this.lastComboTime < 3000) {
      this.comboCount += comboCount;
    } else {
      this.comboCount = comboCount;
    }
    this.lastComboTime = now;

    // 5콤보 이상일 때 보이스 재생
    if (this.comboCount >= 5) {
      playVoiceLineDebounced("combo", 400, { 
        volume: (this.cfg.voice?.voiceVolume || 0.3) * 1.3 
      });
    }
  }

  // [v2.1.0] 승리 보이스
  playVictoryVoice() {
    playVoiceLine("victory", { 
      volume: (this.cfg.voice?.voiceVolume || 0.3) * 1.5 
    });
  }

  // [v2.1.0] 패배 보이스
  playDefeatVoice() {
    playVoiceLine("defeat", { 
      volume: (this.cfg.voice?.voiceVolume || 0.3) * 0.8 
    });
  }

  tick(dt, state, board, dispatch) {
    this.cooldown -= dt * 1000;
    if (this.cooldown > 0) return;
    this.cooldown = this.cfg.reactionMs;

    // [v2.0.1-fix] 새 블록 스폰 감지 및 그레이스 기간 설정
    if (this.lastPiece !== state.piece) {
      this.lastPiece = state.piece;
      this.spawnGraceTicks = 2;  // 2틱 동안 하드드롭 금지
    }

    const choice = this.plan(state, board);
    if (!choice) return;

    if (Math.random() < this.cfg.mistake) {
      dispatch("ai", Math.random() < 0.5 ? "left" : "right");
      return;
    }

    // [v2.0.1-fix] 한 틱에 하나의 액션만 수행하도록 변경
    let action = null;
    // [v2.0.1-fix] 회전이 필요한 경우만 회전 (현재 회전 상태와 목표 회전 상태 비교)
    const currentRot = state.rot % PIECES[state.piece].r.length;
    if (choice.rotations !== currentRot) {
      action = "rotate";
    } else if (state.x < choice.targetX) {
      action = "right";
    } else if (state.x > choice.targetX) {
      action = "left";
    } else if (this.spawnGraceTicks > 0) {
      // [v2.0.1-fix] 그레이스 기간 동안 하드드롭 금지
      this.spawnGraceTicks--;
      action = "softDrop";
    } else if (state.y >= 0) {
      action = "hardDrop";
    } else {
      action = "softDrop";
    }
    dispatch("ai", action);
  }

  plan(state, board) {
    const piece = state.piece;
    const rots = PIECES[piece].r.length;
    let best = null;

    for (let r = 0; r < rots; r += 1) {
      for (let x = -2; x < 10; x += 1) {
        let y = -2;
        while (!board.collides(piece, r, x, y + 1)) y += 1;
        if (board.collides(piece, r, x, y)) continue;
        const score = this.evaluate(board, piece, r, x, y);
        if (!best || score > best.score) best = { score, rotations: r, targetX: x };
      }
    }
    return best;
  }

  evaluate(board, piece, rot, x, y) {
    const clone = board.grid.map((row) => [...row]);
    const shape = PIECES[piece].r[rot];
    for (let py = 0; py < shape.length; py += 1) {
      for (let px = 0; px < shape[py].length; px += 1) {
        if (!shape[py][px]) continue;
        const gx = x + px;
        const gy = y + py;
        if (gy >= 0 && gy < 20 && gx >= 0 && gx < 10) clone[gy][gx] = piece;
      }
    }
    let holes = 0;
    let height = 0;
    let lines = 0;

    for (let cx = 0; cx < 10; cx += 1) {
      let seen = false;
      for (let cy = 0; cy < 20; cy += 1) {
        if (clone[cy][cx]) {
          seen = true;
          height = Math.max(height, 20 - cy);
        } else if (seen) holes += 1;
      }
    }

    for (let y2 = 0; y2 < 20; y2 += 1) {
      if (clone[y2].every((v) => v)) lines += 1;
    }

    return this.wasmMath.add(lines * 200 - holes * 45 - height * 6, 0);
  }
}
