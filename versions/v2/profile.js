const text = (value, fallback = '') => {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
};

const number = value => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;

const date = value => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const httpsUrl = value => {
  const normalized = text(value);
  return /^https:\/\//i.test(normalized) ? normalized : '';
};

export const PUBLIC_PROFILE_DEFAULTS = Object.freeze({
  displayName: true,
  avatar: true,
  username: false,
  city: false,
  levelTitle: true,
  totalPoints: false,
  streak: false,
  friendsCount: false,
  eventsCount: false,
  about: false,
  sphereNames: true,
  spherePercentages: false,
  friendsList: false
});

export const NEVER_PUBLIC_FIELDS = Object.freeze([
  'email', 'phone', 'subscription', 'payments', 'privacy', 'security',
  'journal', 'finance', 'health', 'pets'
]);

export const CABINET_SECTIONS = Object.freeze([
  Object.freeze({ title:'Аккаунт', items:[
    Object.freeze({ route:'profile.personalData', icon:'👤', label:'Личные данные' }),
    Object.freeze({ route:'profile.subscription', icon:'⭐', label:'Тариф и подписка' }),
    Object.freeze({ route:'profile.payments', icon:'▤', label:'История платежей' }),
    Object.freeze({ route:'profile.clubAccess', icon:'🔑', label:'Клубные доступы' })
  ]}),
  Object.freeze({ title:'Настройки', items:[
    Object.freeze({ route:'profile.settings', icon:'⚙', label:'Настройки' }),
    Object.freeze({ route:'profile.notifications', icon:'🔔', label:'Уведомления' }),
    Object.freeze({ route:'profile.privacy', icon:'◉', label:'Приватность' }),
    Object.freeze({ route:'profile.security', icon:'🛡', label:'Безопасность' }),
    Object.freeze({ route:'profile.language', icon:'🌐', label:'Язык', value:'Русский' })
  ]}),
  Object.freeze({ title:'Клуб', items:[
    Object.freeze({ route:'profile.achievements', icon:'🏆', label:'Достижения' }),
    Object.freeze({ route:'profile.invite', icon:'＋', label:'Пригласить друга' }),
    Object.freeze({ route:'profile.giftCards', icon:'🎁', label:'Подарочные карты' })
  ]}),
  Object.freeze({ title:'Поддержка', items:[
    Object.freeze({ route:'profile.help', icon:'?', label:'Помощь' }),
    Object.freeze({ route:'profile.about', icon:'i', label:'О приложении' }),
    Object.freeze({ route:'profile.version', icon:'↔', label:'Версия приложения' })
  ]})
]);

function documentData(snapshot) {
  return snapshot?.exists ? (snapshot.data() || {}) : {};
}

function initials(first, last, displayName) {
  const parts = [first, last].filter(Boolean);
  if (!parts.length) parts.push(...displayName.split(/\s+/).slice(0, 2));
  return parts.map(part => part[0]).join('').toUpperCase().slice(0, 2) || 'МК';
}

function safeVisibility(raw) {
  const allowed = {};
  for (const [field, fallback] of Object.entries(PUBLIC_PROFILE_DEFAULTS)) {
    allowed[field] = typeof raw?.[field] === 'boolean' ? raw[field] : fallback;
  }
  return Object.freeze(allowed);
}

function selectedList(value) {
  return Array.isArray(value) ? value.filter(item => item && typeof item === 'object').slice(0, 12) : [];
}

export function normalizeProfile({ user = {}, userData = {}, access = null, telegramUser = null } = {}) {
  const personal = userData.personal && typeof userData.personal === 'object' ? userData.personal : {};
  const first = text(user.first || user.firstName || telegramUser?.first_name);
  const last = text(user.last || user.lastName || telegramUser?.last_name);
  const displayName = text(user.fullName || user.name || `${first} ${last}`, 'Участник MenClub');
  const username = text(user.tgUsername || user.username || telegramUser?.username).replace(/^@/, '');
  const visibility = safeVisibility(user.publicProfile?.visibility);
  const level = number(user.level);
  const points = number(userData.habits?.points ?? user.points);
  const publicProfile = user.publicProfile && typeof user.publicProfile === 'object' ? user.publicProfile : {};
  return Object.freeze({
    identity:Object.freeze({
      displayName,
      first,
      last,
      initials:initials(first, last, displayName),
      username,
      avatarUrl:httpsUrl(user.avatarUrl || user.photoUrl || telegramUser?.photo_url)
    }),
    level,
    title:text(user.levelTitle, level ? `Уровень ${level}` : 'Участник клуба'),
    points,
    streak:number(user.streak),
    city:text(personal.city || user.city),
    about:text(publicProfile.about),
    interests:Array.isArray(personal.interests) ? personal.interests.map(value => text(value)).filter(Boolean) : [],
    subscription:Object.freeze({
      accessClass:text(access?.accessClass, 'unknown'),
      plan:text(access?.plan || user.subscriptionPlan),
      until:date(access?.until || user.subscriptionUntil),
      source:text(access?.source, 'не определён')
    }),
    visibility,
    selectedAchievements:selectedList(publicProfile.achievements),
    selectedMoments:selectedList(publicProfile.moments),
    selectedSocialLinks:selectedList(publicProfile.socialLinks).filter(link => link.visible === true && httpsUrl(link.url)).map(link => ({ ...link, url:httpsUrl(link.url) })),
    capabilities:Object.freeze({
      reads:true,
      profileWrites:false,
      publicProfileWrites:false,
      dataReset:false,
      memberShare:false
    })
  });
}

export async function loadProfileExperience(db, uid, options = {}) {
  if (!db || !uid) throw new Error('Authenticated Firestore and uid are required');
  const [userSnapshot, userDataSnapshot] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('user_data').doc(uid).get()
  ]);
  return normalizeProfile({
    user:documentData(userSnapshot),
    userData:documentData(userDataSnapshot),
    access:options.access,
    telegramUser:options.telegramUser
  });
}

export function createProfileRepository(adapter = null) {
  const capabilities = Object.freeze({
    profileWrites:Boolean(adapter?.saveProfile),
    publicProfileWrites:Boolean(adapter?.savePublicProfile),
    dataReset:Boolean(adapter?.resetData),
    memberShare:Boolean(adapter?.createMemberShareLink)
  });
  const requireCapability = (name, message) => {
    if (!capabilities[name]) throw new Error(message);
  };
  return Object.freeze({
    capabilities,
    async saveProfile(context) {
      requireCapability('profileWrites', 'Profile writes require approved schema and Security Rules');
      return adapter.saveProfile(context);
    },
    async savePublicProfile(context) {
      requireCapability('publicProfileWrites', 'Public profile writes require approved schema and Security Rules');
      const result = await adapter.savePublicProfile(context);
      if (!result?.confirmed) throw new Error('Public profile save was not confirmed');
      return result;
    },
    async resetData(context) {
      requireCapability('dataReset', 'Data reset requires a reviewed deletion contract');
      const result = await adapter.resetData(context);
      if (!result?.confirmed) throw new Error('Data reset was not confirmed');
      return result;
    },
    async createMemberShareLink(context) {
      requireCapability('memberShare', 'Member-safe share route is not available');
      return adapter.createMemberShareLink(context);
    }
  });
}

export function publicProfileView(profile) {
  const visibility = profile.visibility || PUBLIC_PROFILE_DEFAULTS;
  const visible = (field, value) => visibility[field] ? value : null;
  return Object.freeze({
    identity:Object.freeze({
      displayName:profile.identity.displayName,
      initials:profile.identity.initials,
      avatarUrl:profile.identity.avatarUrl,
      username:visible('username', profile.identity.username)
    }),
    title:profile.title,
    level:profile.level,
    points:visible('totalPoints', profile.points),
    streak:visible('streak', profile.streak),
    city:visible('city', profile.city),
    about:visible('about', profile.about),
    sphereNames:visibility.sphereNames,
    spherePercentages:visibility.spherePercentages,
    achievements:profile.selectedAchievements,
    moments:profile.selectedMoments,
    socialLinks:profile.selectedSocialLinks,
    friendsList:visibility.friendsList ? [] : null
  });
}

export function visibilitySummary(visibility = PUBLIC_PROFILE_DEFAULTS) {
  const labels = {
    displayName:'имя', avatar:'аватар', username:'username', city:'город', levelTitle:'уровень',
    totalPoints:'баллы', streak:'серия', friendsCount:'число друзей', eventsCount:'события',
    about:'о себе', sphereNames:'названия сфер', spherePercentages:'проценты сфер', friendsList:'список друзей'
  };
  return Object.entries(visibility).filter(([, value]) => value).map(([key]) => labels[key]).filter(Boolean);
}
