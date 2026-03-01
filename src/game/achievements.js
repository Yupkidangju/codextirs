/**
 * [v1.0.0] 도전 과제 시스템 (Achievements System)
 *
 * 작성일: 2026-02-28
 * 기능:
 *   - 15개 도전 과제 관리 (4개 카테고리)
 *   - localStorage 기반 진행 상황 저장
 *   - 도전 과제 해제 알림
 *   - 진행률 추적
 */

// 도전 과제 카테고리
export const ACHIEVEMENT_CATEGORIES = {
  COMBAT: 'combat',     // 전투
  SKILL: 'skill',       // 스킬
  COLLECTION: 'collection', // 수집
  SPECIAL: 'special'    // 특별
};

// 희귀도 정의
export const ACHIEVEMENT_RARITY = {
  BRONZE: { level: 1, icon: '🥉', color: '#CD7F32', name: 'Bronze' },
  SILVER: { level: 2, icon: '🥈', color: '#C0C0C0', name: 'Silver' },
  GOLD: { level: 3, icon: '🥇', color: '#FFD700', name: 'Gold' }
};

// 모든 도전 과제 정의
export const ACHIEVEMENTS = {
  // ==================== 전투 (Combat) ====================
  'first_blood': {
    id: 'first_blood',
    name: { 'ko': '첫 승리', 'en': 'First Blood', 'ja': '初勝利', 'zh-TW': '首勝', 'zh-CN': '首胜' },
    description: { 'ko': '첫 번째 전투에서 승리하세요', 'en': 'Win your first battle', 'ja': '最初の戦闘に勝利する', 'zh-TW': '贏得你的第一場戰鬥', 'zh-CN': '赢得你的第一场战斗' },
    category: ACHIEVEMENT_CATEGORIES.COMBAT,
    rarity: ACHIEVEMENT_RARITY.BRONZE,
    condition: { type: 'battle_wins', target: 1 }
  },
  'combo_master': {
    id: 'combo_master',
    name: { 'ko': '콤보 마스터', 'en': 'Combo Master', 'ja': 'コンボマスター', 'zh-TW': '連擊大師', 'zh-CN': '连击大师' },
    description: { 'ko': '15콤보 이상 달성', 'en': 'Achieve 15+ combo', 'ja': '15コンボ以上達成', 'zh-TW': '達成15連擊以上', 'zh-CN': '达成15连击以上' },
    category: ACHIEVEMENT_CATEGORIES.COMBAT,
    rarity: ACHIEVEMENT_RARITY.SILVER,
    condition: { type: 'max_combo', target: 15 }
  },
  'tspin_expert': {
    id: 'tspin_expert',
    name: { 'ko': 'T-스핀 전문가', 'en': 'T-Spin Expert', 'ja': 'Tスピンエキスパート', 'zh-TW': 'T-Spin專家', 'zh-CN': 'T-Spin专家' },
    description: { 'ko': 'T-스핀 50회 클리어', 'en': 'Clear 50 T-Spins', 'ja': 'Tスピンを50回クリア', 'zh-TW': '清除50次T-Spin', 'zh-CN': '清除50次T-Spin' },
    category: ACHIEVEMENT_CATEGORIES.COMBAT,
    rarity: ACHIEVEMENT_RARITY.SILVER,
    condition: { type: 'tspin_count', target: 50 }
  },
  'tetris_god': {
    id: 'tetris_god',
    name: { 'ko': '테트리스 신', 'en': 'Tetris God', 'ja': 'テトリス神', 'zh-TW': '俄羅斯方塊之神', 'zh-CN': '俄罗斯方块之神' },
    description: { 'ko': '테트리스(4줄) 100회 클리어', 'en': 'Clear 100 Tetris (4-lines)', 'ja': 'テトリスを100回クリア', 'zh-TW': '清除100次Tetris（4行）', 'zh-CN': '清除100次Tetris（4行）' },
    category: ACHIEVEMENT_CATEGORIES.COMBAT,
    rarity: ACHIEVEMENT_RARITY.GOLD,
    condition: { type: 'tetris_count', target: 100 }
  },
  'perfect_victory': {
    id: 'perfect_victory',
    name: { 'ko': '완벽한 승리', 'en': 'Perfect Victory', 'ja': '完璧な勝利', 'zh-TW': '完美勝利', 'zh-CN': '完美胜利' },
    description: { 'ko': '피해 없이 승리', 'en': 'Win without taking damage', 'ja': 'ダメージを受けずに勝利', 'zh-TW': '不受到傷害而獲勝', 'zh-CN': '不受伤害而获胜' },
    category: ACHIEVEMENT_CATEGORIES.COMBAT,
    rarity: ACHIEVEMENT_RARITY.GOLD,
    condition: { type: 'perfect_win', target: 1 }
  },

  // ==================== 스킬 (Skill) ====================
  'skill_user': {
    id: 'skill_user',
    name: { 'ko': '스킬 사용자', 'en': 'Skill User', 'ja': 'スキル使用者', 'zh-TW': '技能使用者', 'zh-CN': '技能使用者' },
    description: { 'ko': '스킬을 한 번 사용하세요', 'en': 'Use any skill once', 'ja': 'スキルを1回使用する', 'zh-TW': '使用任何技能一次', 'zh-CN': '使用任何技能一次' },
    category: ACHIEVEMENT_CATEGORIES.SKILL,
    rarity: ACHIEVEMENT_RARITY.BRONZE,
    condition: { type: 'skill_use', target: 1 }
  },
  'blind_master': {
    id: 'blind_master',
    name: { 'ko': '블라인드 마스터', 'en': 'Blind Master', 'ja': 'ブラインドマスター', 'zh-TW': '失明大師', 'zh-CN': '失明大师' },
    description: { 'ko': '상대가 블라인드 상태일 때 승리', 'en': 'Win while opponent is blinded', 'ja': '相手がブラインド中に勝利', 'zh-TW': '對手失明時獲勝', 'zh-CN': '对手失明时获胜' },
    category: ACHIEVEMENT_CATEGORIES.SKILL,
    rarity: ACHIEVEMENT_RARITY.SILVER,
    condition: { type: 'win_while_blind', target: 1 }
  },
  'reflect_king': {
    id: 'reflect_king',
    name: { 'ko': '반사왕', 'en': 'Reflect King', 'ja': '反射王', 'zh-TW': '反射王', 'zh-CN': '反射王' },
    description: { 'ko': '총 20줄의 가비지 라인 반사', 'en': 'Reflect 20 garbage lines total', 'ja': '合計20ラインのガベージを反射', 'zh-TW': '總共反射20行垃圾行', 'zh-CN': '总共反射20行垃圾行' },
    category: ACHIEVEMENT_CATEGORIES.SKILL,
    rarity: ACHIEVEMENT_RARITY.SILVER,
    condition: { type: 'reflect_lines', target: 20 }
  },
  'skill_combo': {
    id: 'skill_combo',
    name: { 'ko': '스킬 콤보', 'en': 'Skill Combo', 'ja': 'スキルコンボ', 'zh-TW': '技能連擊', 'zh-CN': '技能连击' },
    description: { 'ko': '한 게임에서 3개의 스킬 모두 사용', 'en': 'Use all 3 skills in one game', 'ja': '1ゲームで3つのスキルを全て使用', 'zh-TW': '在一場遊戲中使用所有3個技能', 'zh-CN': '在一场游戏中使用所有3个技能' },
    category: ACHIEVEMENT_CATEGORIES.SKILL,
    rarity: ACHIEVEMENT_RARITY.GOLD,
    condition: { type: 'all_skills_one_game', target: 1 }
  },

  // ==================== 수집 (Collection) ====================
  'item_hunter': {
    id: 'item_hunter',
    name: { 'ko': '아이템 사냥꾼', 'en': 'Item Hunter', 'ja': 'アイテムハンター', 'zh-TW': '道具獵人', 'zh-CN': '道具猎人' },
    description: { 'ko': '총 50개의 아이템 수집', 'en': 'Collect 50 items total', 'ja': '合計50個のアイテムを収集', 'zh-TW': '總共收集50個道具', 'zh-CN': '总共收集50个道具' },
    category: ACHIEVEMENT_CATEGORIES.COLLECTION,
    rarity: ACHIEVEMENT_RARITY.BRONZE,
    condition: { type: 'items_collected', target: 50 }
  },
  'bomb_specialist': {
    id: 'bomb_specialist',
    name: { 'ko': '폭탄 전문가', 'en': 'Bomb Specialist', 'ja': '爆弾専門家', 'zh-TW': '炸彈專家', 'zh-CN': '炸弹专家' },
    description: { 'ko': '폭탄 30개 클리어', 'en': 'Clear 30 bombs', 'ja': '爆弾を30個クリア', 'zh-TW': '清除30個炸彈', 'zh-CN': '清除30个炸弹' },
    category: ACHIEVEMENT_CATEGORIES.COLLECTION,
    rarity: ACHIEVEMENT_RARITY.SILVER,
    condition: { type: 'bombs_cleared', target: 30 }
  },
  'shield_master': {
    id: 'shield_master',
    name: { 'ko': '실드 마스터', 'en': 'Shield Master', 'ja': 'シールドマスター', 'zh-TW': '護盾大師', 'zh-CN': '护盾大师' },
    description: { 'ko': '실드로 15회 공격 차단', 'en': 'Block 15 attacks with shield', 'ja': 'シールドで15回攻撃をブロック', 'zh-TW': '用護盾阻擋15次攻擊', 'zh-CN': '用护盾阻挡15次攻击' },
    category: ACHIEVEMENT_CATEGORIES.COLLECTION,
    rarity: ACHIEVEMENT_RARITY.GOLD,
    condition: { type: 'shield_blocks', target: 15 }
  },

  // ==================== 특별 (Special) ====================
  'fever_rage': {
    id: 'fever_rage',
    name: { 'ko': '피버 레이지', 'en': 'Fever Rage', 'ja': 'フィーバーレイジ', 'zh-TW': '狂熱暴走', 'zh-CN': '狂热暴走' },
    description: { 'ko': '피버 모드에서 20콤보 이상 달성', 'en': 'Reach 20+ combo in fever mode', 'ja': 'フィーバーモードで20コンボ以上', 'zh-TW': '在狂熱模式中達成20連擊以上', 'zh-CN': '在狂热模式中达成20连击以上' },
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITY.GOLD,
    condition: { type: 'fever_combo', target: 20 }
  },
  'speed_demon': {
    id: 'speed_demon',
    name: { 'ko': '스피드 데몬', 'en': 'Speed Demon', 'ja': 'スピードデーモン', 'zh-TW': '速度惡魔', 'zh-CN': '速度恶魔' },
    description: { 'ko': '60초 이내 승리', 'en': 'Win in under 60 seconds', 'ja': '60秒以内に勝利', 'zh-TW': '在60秒內獲勝', 'zh-CN': '在60秒内获胜' },
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITY.GOLD,
    condition: { type: 'fast_win', target: 60 }
  },
  'untouchable': {
    id: 'untouchable',
    name: { 'ko': '무적', 'en': 'Untouchable', 'ja': '無敵', 'zh-TW': '無敵', 'zh-CN': '无敌' },
    description: { 'ko': '풀 HP로 승리', 'en': 'Win with full health', 'ja': 'フルHPで勝利', 'zh-TW': '滿生命值獲勝', 'zh-CN': '满生命值获胜' },
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITY.GOLD,
    condition: { type: 'full_health_win', target: 1 }
  }
};

// localStorage 키
const STORAGE_KEY = 'codextirs_achievements';

/**
 * 도전 과제 시스템 클래스
 */
export class AchievementSystem {
  constructor() {
    // 도전 과제 진행 상황 저장
    this.progress = {};
    // 해제된 도전 과제 ID 집합
    this.unlocked = new Set();
    // 알림 콜백 함수
    this.notificationCallback = null;
    // 효과음 재생 콜백
    this.soundCallback = null;
    // 현재 게임 세션 데이터 (휘발성)
    this.sessionData = {
      skillsUsed: new Set(),
      gameStartTime: null,
      damageTaken: 0,
      maxComboInFever: 0
    };

    this.initAchievements();
  }

  /**
   * 초기화 - localStorage에서 진행 상황 로드
   */
  initAchievements() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.progress = data.progress || {};
        this.unlocked = new Set(data.unlocked || []);
      }
    } catch (e) {
      console.warn('[AchievementSystem] localStorage 로드 실패:', e);
      this.progress = {};
      this.unlocked = new Set();
    }

    // 모든 도전 과제의 초기 진행 상황 설정
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (!this.progress[id]) {
        this.progress[id] = {
          current: 0,
          unlocked: false,
          unlockedAt: null
        };
      }
    }
  }

  /**
   * 진행 상황을 localStorage에 저장
   */
  saveAchievements() {
    try {
      const data = {
        progress: this.progress,
        unlocked: Array.from(this.unlocked),
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[AchievementSystem] localStorage 저장 실패:', e);
    }
  }

  /**
   * 알림 콜백 설정
   * @param {Function} callback - (achievement) => void
   */
  setNotificationCallback(callback) {
    this.notificationCallback = callback;
  }

  /**
   * 효과음 콜백 설정
   * @param {Function} callback - () => void
   */
  setSoundCallback(callback) {
    this.soundCallback = callback;
  }

  /**
   * 새 게임 세션 시작
   */
  startNewGame() {
    this.sessionData = {
      skillsUsed: new Set(),
      gameStartTime: Date.now(),
      damageTaken: 0,
      maxComboInFever: 0,
      isFeverActive: false
    };
  }

  /**
   * 도전 과제 해제 확인 및 처리
   * @param {string} id - 도전 과제 ID
   * @param {number} value - 현재 값 (옵션)
   * @returns {boolean} - 해제되었는지 여부
   */
  checkAchievement(id, value = null) {
    const achievement = ACHIEVEMENTS[id];
    if (!achievement) {
      console.warn(`[AchievementSystem] 존재하지 않는 도전 과제: ${id}`);
      return false;
    }

    // 이미 해제된 경우
    if (this.unlocked.has(id)) {
      return false;
    }

    const condition = achievement.condition;
    let currentValue = value !== null ? value : (this.progress[id]?.current || 0);

    // 조건 충족 확인
    const isUnlocked = currentValue >= condition.target;

    if (isUnlocked) {
      this.unlockAchievement(id);
      return true;
    }

    return false;
  }

  /**
   * 도전 과제 해제
   * @param {string} id - 도전 과제 ID
   */
  unlockAchievement(id) {
    const achievement = ACHIEVEMENTS[id];
    if (!achievement) return;

    if (this.unlocked.has(id)) return;

    // 해제 처리
    this.unlocked.add(id);
    this.progress[id].unlocked = true;
    this.progress[id].unlockedAt = new Date().toISOString();
    this.progress[id].current = achievement.condition.target;

    // 저장
    this.saveAchievements();

    // 알림 표시
    if (this.notificationCallback) {
      this.notificationCallback(achievement);
    }

    // 효과음 재생
    if (this.soundCallback) {
      this.soundCallback();
    }

    console.log(`[AchievementSystem] 도전 과제 해제: ${achievement.name['ko']}`);
  }

  /**
   * 도전 과제 진행 상황 업데이트
   * @param {string} id - 도전 과제 ID
   * @param {number} increment - 증가량
   * @returns {boolean} - 새로 해제되었는지 여부
   */
  updateAchievementProgress(id, increment = 1) {
    const achievement = ACHIEVEMENTS[id];
    if (!achievement) return false;

    // 이미 해제된 경우
    if (this.unlocked.has(id)) {
      return false;
    }

    // 진행 상황 업데이트
    const current = (this.progress[id]?.current || 0) + increment;
    this.progress[id].current = current;

    // 조건 확인 및 해제 체크
    const isUnlocked = this.checkAchievement(id, current);

    if (!isUnlocked) {
      // 해제되지 않았으면 진행 상황만 저장
      this.saveAchievements();
    }

    return isUnlocked;
  }

  /**
   * 특정 도전 과제의 진행 상황 조회
   * @param {string} id - 도전 과제 ID
   * @returns {Object} - 진행 상황 객체
   */
  getAchievementProgress(id) {
    const achievement = ACHIEVEMENTS[id];
    if (!achievement) return null;

    const progress = this.progress[id] || { current: 0, unlocked: false };

    return {
      ...achievement,
      progress: {
        current: progress.current,
        target: achievement.condition.target,
        percentage: Math.min(100, (progress.current / achievement.condition.target) * 100),
        unlocked: progress.unlocked,
        unlockedAt: progress.unlockedAt
      }
    };
  }

  /**
   * 모든 도전 과제 조회
   * @returns {Array} - 도전 과제 배열 (진행 상황 포함)
   */
  getAllAchievements() {
    return Object.values(ACHIEVEMENTS).map(achievement => {
      const progress = this.progress[achievement.id] || { current: 0, unlocked: false };
      return {
        ...achievement,
        progress: {
          current: progress.current,
          target: achievement.condition.target,
          percentage: Math.min(100, (progress.current / achievement.condition.target) * 100),
          unlocked: progress.unlocked,
          unlockedAt: progress.unlockedAt
        }
      };
    });
  }

  /**
   * 카테고리별 도전 과제 조회
   * @param {string} category - 카테고리 ID
   * @returns {Array} - 해당 카테고리의 도전 과제 배열
   */
  getAchievementsByCategory(category) {
    return this.getAllAchievements().filter(a => a.category === category);
  }

  /**
   * 해제된 도전 과제 수 조회
   * @returns {number}
   */
  getUnlockedCount() {
    return this.unlocked.size;
  }

  /**
   * 총 도전 과제 수 조회
   * @returns {number}
   */
  getTotalCount() {
    return Object.keys(ACHIEVEMENTS).length;
  }

  /**
   * 전체 진행률 백분율 조회
   * @returns {number}
   */
  getOverallProgress() {
    return (this.unlocked.size / this.getTotalCount()) * 100;
  }

  // ==================== 게임 이벤트 핸들러 ====================

  /**
   * 전투 승리 시 호출
   * @param {Object} stats - 게임 통계
   * @param {boolean} stats.isPerfect - 피해 없이 승리
   * @param {boolean} stats.isFullHealth - 풀 HP 승리
   * @param {number} stats.gameTime - 게임 시간 (초)
   * @param {boolean} stats.opponentBlinded - 상대 블라인드 상태
   */
  onBattleWin(stats = {}) {
    // 첫 승리
    this.updateAchievementProgress('first_blood', 1);

    // 완벽한 승리 (피해 없음)
    if (stats.isPerfect) {
      this.checkAchievement('perfect_victory', 1);
    }

    // 풀 HP 승리
    if (stats.isFullHealth) {
      this.checkAchievement('untouchable', 1);
    }

    // 60초 이내 승리
    if (stats.gameTime && stats.gameTime <= 60) {
      this.checkAchievement('speed_demon', 1);
    }

    // 상대 블라인드 상태에서 승리
    if (stats.opponentBlinded) {
      this.checkAchievement('blind_master', 1);
    }

    // 스킬 콤보 (한 게임에서 3개 스킬 모두 사용)
    if (this.sessionData.skillsUsed.size >= 3) {
      this.checkAchievement('skill_combo', 1);
    }
  }

  /**
   * 콤보 달성 시 호출
   * @param {number} combo - 현재 콤보 수
   * @param {boolean} isFever - 피버 모드 여부
   */
  onCombo(combo, isFever = false) {
    // 콤보 마스터 (15콤보)
    if (combo >= 15) {
      this.checkAchievement('combo_master', combo);
    }

    // 피버 레이지 (피버 중 20콤보)
    if (isFever) {
      this.sessionData.maxComboInFever = Math.max(this.sessionData.maxComboInFever, combo);
      if (this.sessionData.maxComboInFever >= 20) {
        this.checkAchievement('fever_rage', this.sessionData.maxComboInFever);
      }
    }
  }

  /**
   * T-스핀 클리어 시 호출
   */
  onTSpinClear() {
    this.updateAchievementProgress('tspin_expert', 1);
  }

  /**
   * 테트리스(4줄) 클리어 시 호출
   */
  onTetrisClear() {
    this.updateAchievementProgress('tetris_god', 1);
  }

  /**
   * 스킬 사용 시 호출
   * @param {string} skillId - 스킬 ID
   */
  onSkillUse(skillId) {
    // 스킬 사용자 (첫 사용)
    this.updateAchievementProgress('skill_user', 1);

    // 세션에 스킬 사용 기록
    this.sessionData.skillsUsed.add(skillId);
  }

  /**
   * 가비지 라인 반사 시 호출
   * @param {number} lines - 반사한 라인 수
   */
  onReflectGarbage(lines) {
    this.updateAchievementProgress('reflect_king', lines);
  }

  /**
   * 아이템 수집 시 호출
   * @param {string} itemType - 아이템 타입
   */
  onItemCollect(itemType) {
    // 아이템 사냥꾼
    this.updateAchievementProgress('item_hunter', 1);

    // 실드 마스터 (실드로 공격 차단)
    if (itemType === 'shield_block') {
      this.updateAchievementProgress('shield_master', 1);
    }
  }

  /**
   * 폭탄 클리어 시 호출
   */
  onBombClear() {
    this.updateAchievementProgress('bomb_specialist', 1);
  }

  /**
   * 피버 모드 상태 변경 시 호출
   * @param {boolean} isActive - 활성화 여부
   */
  onFeverChange(isActive) {
    this.sessionData.isFeverActive = isActive;
    if (!isActive) {
      this.sessionData.maxComboInFever = 0;
    }
  }

  /**
   * 데미지 받을 때 호출
   * @param {number} damage - 받은 데미지
   */
  onDamageTaken(damage) {
    this.sessionData.damageTaken += damage;
  }

  /**
   * 모든 도전 과제 초기화 (디버그용)
   */
  resetAll() {
    this.progress = {};
    this.unlocked = new Set();
    this.sessionData = {
      skillsUsed: new Set(),
      gameStartTime: null,
      damageTaken: 0,
      maxComboInFever: 0
    };

    for (const id of Object.keys(ACHIEVEMENTS)) {
      this.progress[id] = {
        current: 0,
        unlocked: false,
        unlockedAt: null
      };
    }

    this.saveAchievements();
    console.log('[AchievementSystem] 모든 도전 과제 초기화됨');
  }
}

// 싱글톤 인스턴스
let achievementSystemInstance = null;

/**
 * 도전 과제 시스템 싱글톤 인스턴스 가져오기
 * @returns {AchievementSystem}
 */
export function getAchievementSystem() {
  if (!achievementSystemInstance) {
    achievementSystemInstance = new AchievementSystem();
  }
  return achievementSystemInstance;
}

/**
 * 도전 과제 시스템 초기화 (앱 시작 시 호출)
 * @param {Function} notificationCallback - 알림 콜백
 * @param {Function} soundCallback - 효과음 콜백
 * @returns {AchievementSystem}
 */
export function initAchievements(notificationCallback = null, soundCallback = null) {
  const system = getAchievementSystem();
  if (notificationCallback) {
    system.setNotificationCallback(notificationCallback);
  }
  if (soundCallback) {
    system.setSoundCallback(soundCallback);
  }
  return system;
}

// 편의 함수들
export const checkAchievement = (id, condition) => getAchievementSystem().checkAchievement(id, condition);
export const unlockAchievement = (id) => getAchievementSystem().unlockAchievement(id);
export const getAchievementProgress = (id) => getAchievementSystem().getAchievementProgress(id);
export const updateAchievementProgress = (id, increment) => getAchievementSystem().updateAchievementProgress(id, increment);
export const saveAchievements = () => getAchievementSystem().saveAchievements();
export const getAllAchievements = () => getAchievementSystem().getAllAchievements();

export default {
  AchievementSystem,
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_RARITY,
  getAchievementSystem,
  initAchievements,
  checkAchievement,
  unlockAchievement,
  getAchievementProgress,
  updateAchievementProgress,
  saveAchievements,
  getAllAchievements
};
