// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

// English is the application's default/fallback language.
// Message ids are grouped by the component they belong to.
const messages: Record<string, string> = {
    'login.form.title': 'Sign in',
    'login.form.newUser': 'New user?',
    'login.form.createAccount': 'Create an account',
    'login.form.forgotPassword': 'Forgot password?',
    'login.form.credentialPlaceholder': 'Email or username',
    'login.form.passwordPlaceholder': 'Password',
    'login.form.passwordRequired': 'Please specify a password',
    'login.form.next': 'Next',

    'settings.title': 'Settings',
    'settings.close': 'Close',
    'settings.tabs.general': 'General',
    'settings.tabs.player': 'Player',
    'settings.tabs.workspace': 'Workspace',
    'settings.tabs.shortcuts': 'Shortcuts',
    'settings.general.languageLabel': 'Language',
    'settings.general.languageDescription': 'Choose the language used across the CVAT interface.',
    'settings.general.languageOption.en': 'English',
    'settings.general.languageOption.ja': '日本語 (Japanese)',
};

export default messages;
