// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';
import Tabs from 'antd/lib/tabs';
import Text from 'antd/lib/typography/Text';
import Select from 'antd/lib/select';
import Modal from 'antd/lib/modal/Modal';
import Button from 'antd/lib/button';
import notification from 'antd/lib/notification';
import {
    PlayCircleOutlined, LaptopOutlined, BuildOutlined, GlobalOutlined,
} from '@ant-design/icons';

import { restoreSettingsAsync, updateCachedSettings } from 'actions/settings-actions';
import WorkspaceSettingsContainer from 'containers/header/settings-modal/workspace-settings';
import PlayerSettingsContainer from 'containers/header/settings-modal/player-settings';
import ShortcutsSettingsContainer from 'containers/header/settings-modal/shortcuts-settings';
import { CombinedState } from 'reducers';
import { useLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from 'i18n';

function GeneralSettings(): JSX.Element {
    const intl = useIntl();
    const [language, setLanguage] = useLanguage();

    return (
        <div className='cvat-settings-general'>
            <Text strong>
                <FormattedMessage id='settings.general.languageLabel' defaultMessage='Language' />
            </Text>
            <div className='cvat-settings-general-language-description'>
                <Text type='secondary'>
                    <FormattedMessage
                        id='settings.general.languageDescription'
                        defaultMessage='Choose the language used across the CVAT interface.'
                    />
                </Text>
            </div>
            <Select
                className='cvat-settings-general-language-select'
                value={language}
                onChange={(value: SupportedLanguage) => setLanguage(value)}
                options={SUPPORTED_LANGUAGES.map((lang) => ({
                    value: lang,
                    label: intl.formatMessage({ id: `settings.general.languageOption.${lang}` }),
                }))}
            />
        </div>
    );
}

interface SettingsModalProps {
    visible: boolean;
    onClose(): void;
}

function SettingsModal(props: SettingsModalProps): JSX.Element {
    const { visible, onClose } = props;

    const settings = useSelector((state: CombinedState) => state.settings);
    const shortcuts = useSelector((state: CombinedState) => state.shortcuts);
    const [settingsInitialized, setSettingsInitialized] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!settingsInitialized) return;

        updateCachedSettings(settings, shortcuts);
    }, [settingsInitialized, settings, shortcuts]);

    useEffect(() => {
        try {
            dispatch(restoreSettingsAsync());
        } catch {
            notification.error({
                message: 'Failed to load settings from local storage',
                className: 'cvat-notification-notice-load-settings-fail',
            });
        } finally {
            setSettingsInitialized(true);
        }
    }, []);

    const tabItems = [
        {
            key: 'general',
            label: <Text><FormattedMessage id='settings.tabs.general' defaultMessage='General' /></Text>,
            icon: <GlobalOutlined />,
            children: <GeneralSettings />,
        },
        {
            key: 'player',
            label: <Text><FormattedMessage id='settings.tabs.player' defaultMessage='Player' /></Text>,
            icon: <PlayCircleOutlined />,
            children: <PlayerSettingsContainer />,
        },
        {
            key: 'workspace',
            label: <Text><FormattedMessage id='settings.tabs.workspace' defaultMessage='Workspace' /></Text>,
            icon: <LaptopOutlined />,
            children: <WorkspaceSettingsContainer />,
        },
        {
            key: 'shortcuts',
            label: <Text><FormattedMessage id='settings.tabs.shortcuts' defaultMessage='Shortcuts' /></Text>,
            icon: <BuildOutlined />,
            children: <ShortcutsSettingsContainer />,
        },
    ];

    return (
        <Modal
            title={<FormattedMessage id='settings.title' defaultMessage='Settings' />}
            open={visible}
            onCancel={onClose}
            width={800}
            className='cvat-settings-modal'
            footer={(
                <Button className='cvat-close-settings-button' type='default' onClick={onClose}>
                    <FormattedMessage id='settings.close' defaultMessage='Close' />
                </Button>
            )}
        >
            <div className='cvat-settings-tabs'>
                <Tabs defaultActiveKey='player' type='card' items={tabItems} />
            </div>
        </Modal>
    );
}

export default React.memo(SettingsModal);
