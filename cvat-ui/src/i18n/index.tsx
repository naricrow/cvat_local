// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useEffect, useState } from 'react';
import { IntlProvider } from 'react-intl';
import ConfigProvider from 'antd/lib/config-provider';
import enUS from 'antd/locale/en_US';
import jaJP from 'antd/locale/ja_JP';
import type { Locale } from 'antd/lib/locale';

import enMessages from './messages/en';
import jaMessages from './messages/ja';
import {
    getLanguage, setLanguage, subscribeToLanguage, SupportedLanguage, SUPPORTED_LANGUAGES,
} from './language-store';

export { setLanguage, SUPPORTED_LANGUAGES };
export type { SupportedLanguage };

// Every catalog is merged over English so a partially translated
// language never leaves a string blank in the UI.
const messagesByLanguage: Record<SupportedLanguage, Record<string, string>> = {
    en: enMessages,
    ja: { ...enMessages, ...jaMessages },
};

const antdLocaleByLanguage: Record<SupportedLanguage, Locale> = {
    en: enUS,
    ja: jaJP,
};

export function useLanguage(): [SupportedLanguage, (language: SupportedLanguage) => void] {
    const [language, setLocalLanguage] = useState<SupportedLanguage>(getLanguage());

    useEffect(() => subscribeToLanguage(() => setLocalLanguage(getLanguage())), []);

    return [language, setLanguage];
}

interface Props {
    children: React.ReactNode;
}

export default function I18nRoot(props: Props): JSX.Element {
    const { children } = props;
    const [language] = useLanguage();

    return (
        <ConfigProvider locale={antdLocaleByLanguage[language]}>
            <IntlProvider locale={language} defaultLocale='en' messages={messagesByLanguage[language]}>
                {children}
            </IntlProvider>
        </ConfigProvider>
    );
}
