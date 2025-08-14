import React from 'react';
import { useTranslation } from 'react-i18next';
import './PrivacyPage.css';

const PrivacyPage = () => {
    const { t } = useTranslation('pages');

    return (
        <div className="privacy-container">
            <div className="privacy-content">
                <div className="privacy-header">
                    <div className="draft-notice">{t('privacy.draftNotice')}</div>
                    <h1>{t('privacy.title')}</h1>
                    <p className="last-updated">{t('privacy.lastUpdated')}: 2024年8月11日</p>
                </div>

                <div className="privacy-body">
                    <section className="privacy-section">
                        <h2>{t('privacy.sections.introduction.title')}</h2>
                        <p>{t('privacy.sections.introduction.content')}</p>
                    </section>

                    <section className="privacy-section">
                        <h2>{t('privacy.sections.collection.title')}</h2>
                        <ul>
                            <li>{t('privacy.sections.collection.items.personal')}</li>
                            <li>{t('privacy.sections.collection.items.usage')}</li>
                            <li>{t('privacy.sections.collection.items.technical')}</li>
                            <li>{t('privacy.sections.collection.items.communication')}</li>
                        </ul>
                    </section>

                    <section className="privacy-section">
                        <h2>{t('privacy.sections.usage.title')}</h2>
                        <ul>
                            <li>{t('privacy.sections.usage.items.service')}</li>
                            <li>{t('privacy.sections.usage.items.communication')}</li>
                            <li>{t('privacy.sections.usage.items.improvement')}</li>
                            <li>{t('privacy.sections.usage.items.legal')}</li>
                        </ul>
                    </section>

                    <section className="privacy-section">
                        <h2>{t('privacy.sections.sharing.title')}</h2>
                        <p>{t('privacy.sections.sharing.content')}</p>
                        <ul>
                            <li>{t('privacy.sections.sharing.items.consent')}</li>
                            <li>{t('privacy.sections.sharing.items.legal')}</li>
                            <li>{t('privacy.sections.sharing.items.business')}</li>
                        </ul>
                    </section>

                    <section className="privacy-section">
                        <h2>{t('privacy.sections.security.title')}</h2>
                        <p>{t('privacy.sections.security.content')}</p>
                    </section>

                    <section className="privacy-section">
                        <h2>{t('privacy.sections.cookies.title')}</h2>
                        <p>{t('privacy.sections.cookies.content')}</p>
                    </section>

                    <section className="privacy-section">
                        <h2>{t('privacy.sections.rights.title')}</h2>
                        <ul>
                            <li>{t('privacy.sections.rights.items.access')}</li>
                            <li>{t('privacy.sections.rights.items.correction')}</li>
                            <li>{t('privacy.sections.rights.items.deletion')}</li>
                            <li>{t('privacy.sections.rights.items.portability')}</li>
                        </ul>
                    </section>

                    <section className="privacy-section">
                        <h2>{t('privacy.sections.retention.title')}</h2>
                        <p>{t('privacy.sections.retention.content')}</p>
                    </section>

                    <section className="privacy-section">
                        <h2>{t('privacy.sections.children.title')}</h2>
                        <p>{t('privacy.sections.children.content')}</p>
                    </section>

                    <section className="privacy-section">
                        <h2>{t('privacy.sections.changes.title')}</h2>
                        <p>{t('privacy.sections.changes.content')}</p>
                    </section>

                    <section className="privacy-section">
                        <h2>{t('privacy.sections.contact.title')}</h2>
                        <p>{t('privacy.sections.contact.content')}</p>
                        <p>Email: privacy@newsforproblem.com</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPage;