import React from 'react';
import { useTranslation } from 'react-i18next';
import './TermsPage.css';

const TermsPage = () => {
    const { t } = useTranslation('pages');

    return (
        <div className="terms-container">
            <div className="terms-content">
                <div className="terms-header">
                    <div className="draft-notice">{t('terms.draftNotice')}</div>
                    <h1>{t('terms.title')}</h1>
                    <p className="last-updated">{t('terms.lastUpdated')}: 2024年8月11日</p>
                </div>

                <div className="terms-body">
                    <section className="terms-section">
                        <h2>{t('terms.sections.introduction.title')}</h2>
                        <p>{t('terms.sections.introduction.content')}</p>
                    </section>

                    <section className="terms-section">
                        <h2>{t('terms.sections.service.title')}</h2>
                        <p>{t('terms.sections.service.content')}</p>
                    </section>

                    <section className="terms-section">
                        <h2>{t('terms.sections.account.title')}</h2>
                        <ul>
                            <li>{t('terms.sections.account.items.responsibility')}</li>
                            <li>{t('terms.sections.account.items.security')}</li>
                            <li>{t('terms.sections.account.items.accuracy')}</li>
                        </ul>
                    </section>

                    <section className="terms-section">
                        <h2>{t('terms.sections.usage.title')}</h2>
                        <ul>
                            <li>{t('terms.sections.usage.items.lawful')}</li>
                            <li>{t('terms.sections.usage.items.noHarm')}</li>
                            <li>{t('terms.sections.usage.items.noInfringement')}</li>
                        </ul>
                    </section>

                    <section className="terms-section">
                        <h2>{t('terms.sections.privacy.title')}</h2>
                        <p>{t('terms.sections.privacy.content')}</p>
                    </section>

                    <section className="terms-section">
                        <h2>{t('terms.sections.limitation.title')}</h2>
                        <p>{t('terms.sections.limitation.content')}</p>
                    </section>

                    <section className="terms-section">
                        <h2>{t('terms.sections.termination.title')}</h2>
                        <p>{t('terms.sections.termination.content')}</p>
                    </section>

                    <section className="terms-section">
                        <h2>{t('terms.sections.changes.title')}</h2>
                        <p>{t('terms.sections.changes.content')}</p>
                    </section>

                    <section className="terms-section">
                        <h2>{t('terms.sections.contact.title')}</h2>
                        <p>{t('terms.sections.contact.content')}</p>
                        <p>Email: support@newsforproblem.com</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsPage;