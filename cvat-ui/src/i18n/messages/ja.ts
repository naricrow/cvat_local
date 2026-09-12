// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

// Japanese translations. Keys not listed here fall back to English
// (see cvat-ui/src/i18n/index.tsx, which merges this file over the
// English catalog before handing it to react-intl).
const messages: Record<string, string> = {
    'login.form.title': 'ログイン',
    'login.form.newUser': '初めてご利用ですか？',
    'login.form.createAccount': 'アカウントを作成',
    'login.form.forgotPassword': 'パスワードをお忘れですか？',
    'login.form.credentialPlaceholder': 'メールアドレスまたはユーザー名',
    'login.form.passwordPlaceholder': 'パスワード',
    'login.form.passwordRequired': 'パスワードを入力してください',
    'login.form.next': '次へ',

    'settings.title': '設定',
    'settings.close': '閉じる',
    'settings.tabs.general': '一般',
    'settings.tabs.player': 'プレイヤー',
    'settings.tabs.workspace': 'ワークスペース',
    'settings.tabs.shortcuts': 'ショートカット',
    'settings.general.languageLabel': '言語',
    'settings.general.languageDescription': 'CVATの画面表示に使用する言語を選択してください。',
    'settings.general.languageOption.en': 'English (英語)',
    'settings.general.languageOption.ja': '日本語',
};

export default messages;
