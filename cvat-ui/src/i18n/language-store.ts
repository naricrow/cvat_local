// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

export type SupportedLanguage = 'en' | 'ja';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'ja'];
const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
const STORAGE_KEY = 'cvatUILanguage';

function isSupportedLanguage(value: string | null): value is SupportedLanguage {
    return !!value && (SUPPORTED_LANGUAGES as string[]).includes(value);
}

function readStoredLanguage(): SupportedLanguage {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (isSupportedLanguage(stored)) {
            return stored;
        }
    } catch {
        // localStorage can be unavailable (e.g. private browsing mode)
    }
    return DEFAULT_LANGUAGE;
}

let currentLanguage: SupportedLanguage = readStoredLanguage();
const listeners = new Set<() => void>();

export function getLanguage(): SupportedLanguage {
    return currentLanguage;
}

export function setLanguage(language: SupportedLanguage): void {
    if (language === currentLanguage) return;
    currentLanguage = language;
    try {
        window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
        // ignore write failures, the choice just won't persist across reloads
    }
    listeners.forEach((listener) => listener());
}

export function subscribeToLanguage(listener: () => void): () => void {
    listeners.add(listener);
    return (): void => {
        listeners.delete(listener);
    };
}
