// ひらがな → カタカナ変換
export function toKatakana(str) {
  return str.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
}

// プロフィールキーから実際の入力値を解決
export function resolveValue(profile, profileKey, field) {
  switch (profileKey) {
    case 'fullName':
      return `${profile.lastName ?? ''} ${profile.firstName ?? ''}`.trim();

    case 'fullNameKana': {
      const combined = `${profile.lastNameKana ?? ''} ${profile.firstNameKana ?? ''}`.trim();
      const hints = [field.placeholder, field.label, field.name, field.id].join(' ');
      return /カタカナ|katakana|フリガナ/i.test(hints) ? toKatakana(combined) : combined;
    }

    case 'emailConfirm':
      return profile.email ?? '';

    case 'phone': {
      const raw = profile.phone ?? '';
      const hasHyphen = field.placeholder?.includes('-');
      return hasHyphen ? raw : raw.replace(/-/g, '');
    }

    case 'postalCode': {
      const raw = profile.postalCode ?? '';
      const hasHyphen = field.placeholder?.includes('-');
      return hasHyphen ? raw : raw.replace(/-/g, '');
    }

    default:
      return profile[profileKey] ?? '';
  }
}
