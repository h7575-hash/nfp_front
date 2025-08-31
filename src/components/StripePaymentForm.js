import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';
import { useTranslation } from 'react-i18next';
import './StripePaymentForm.css';

// Stripe設定とスタイリング
const cardElementOptions = {
    style: {
        base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
                color: '#aab7c4',
            },
            fontFamily: '"Inter", "Helvetica Neue", sans-serif',
            iconColor: '#666EE8',
        },
        invalid: {
            color: '#9e2146',
            iconColor: '#fa755a',
        },
    },
    hidePostalCode: true,
};

// Stripe Elements用のコンポーネント
const PaymentForm = ({ userData, onSuccess, onError, isLoading, setIsLoading }) => {
    const { t } = useTranslation('pages');
    const stripe = useStripe();
    const elements = useElements();
    const [cardComplete, setCardComplete] = useState(false);
    const [cardError, setCardError] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        const card = elements.getElement(CardElement);

        if (!card) {
            onError('カード情報が見つかりません');
            return;
        }

        setIsLoading(true);

        try {
            // フリープランの場合は支払い方法のみ保存
            if (userData.plan === 'free') {
                await handleFreePaymentMethod(card);
            } else {
                // 有料プランの場合はサブスクリプション作成
                await handlePaidSubscription(card);
            }
        } catch (error) {
            console.error('Payment processing error:', error);
            onError(error.message || '決済処理中にエラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    // フリープラン: 支払い方法のみ保存
    const handleFreePaymentMethod = async (card) => {
        // PaymentMethodを作成
        const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: card,
            billing_details: {
                email: userData.email,
                name: userData.company_name || 'User',
            },
        });

        if (pmError) {
            throw new Error(pmError.message);
        }

        // バックエンドに支払い方法を保存
        const response = await fetch('/api/payments/save-payment-method', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                payment_method_id: paymentMethod.id,
                user_data: userData
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'サーバーエラーが発生しました');
        }

        onSuccess({
            type: 'free_plan',
            message: 'アカウントが正常に作成されました',
            data: result
        });
    };

    // 有料プラン: サブスクリプション作成
    const handlePaidSubscription = async (card) => {
        // PaymentMethodを作成
        const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: card,
            billing_details: {
                email: userData.email,
                name: userData.company_name || 'User',
            },
        });

        if (pmError) {
            throw new Error(pmError.message);
        }

        // バックエンドでサブスクリプション作成
        const response = await fetch('/api/payments/create-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                payment_method_id: paymentMethod.id,
                user_data: userData
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'サーバーエラーが発生しました');
        }

        // 3D Secure認証が必要な場合
        if (result.requires_action) {
            const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
                result.payment_intent.client_secret
            );

            if (confirmError) {
                throw new Error(confirmError.message);
            }

            // 認証成功後、再度バックエンドに確認
            const confirmResponse = await fetch('/api/payments/confirm-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription_id: result.subscription_id,
                    payment_intent_id: paymentIntent.id
                }),
            });

            const confirmResult = await confirmResponse.json();

            if (!confirmResponse.ok) {
                throw new Error(confirmResult.error || '認証後の処理でエラーが発生しました');
            }

            onSuccess({
                type: 'paid_subscription',
                message: 'サブスクリプションが正常に作成されました',
                data: confirmResult
            });
        } else {
            // 通常の成功レスポンス
            onSuccess({
                type: 'paid_subscription',
                message: 'サブスクリプションが正常に作成されました',
                data: result
            });
        }
    };

    const handleCardChange = (event) => {
        setCardComplete(event.complete);
        setCardError(event.error ? event.error.message : null);
    };

    const getPlanDisplayInfo = () => {
        switch (userData.plan) {
            case 'plus':
                return {
                    name: 'Plusプラン',
                    price: '¥500 + 税',
                    description: '月額制での課金が開始されます'
                };
            case 'unlimited':
                return {
                    name: 'Unlimitedプラン',
                    price: '¥3,000 + 税',
                    description: '月額制での課金が開始されます'
                };
            case 'free':
                return {
                    name: 'Freeプラン',
                    price: '無料',
                    description: '今回は課金されません。不正利用防止のためカード情報を登録します'
                };
            default:
                return {
                    name: 'プラン',
                    price: '',
                    description: ''
                };
        }
    };

    const planInfo = getPlanDisplayInfo();

    return (
        <form onSubmit={handleSubmit} className="stripe-payment-form">
            <div className="payment-summary">
                <h3>お支払い情報</h3>
                <div className="plan-summary">
                    <div className="plan-info">
                        <span className="plan-name">{planInfo.name}</span>
                        <span className="plan-price">{planInfo.price}</span>
                    </div>
                    <p className="plan-description">{planInfo.description}</p>
                </div>
            </div>

            <div className="card-section">
                <label htmlFor="card-element">
                    クレジットカード情報 *
                </label>
                <div className="card-element-container">
                    <CardElement
                        id="card-element"
                        options={cardElementOptions}
                        onChange={handleCardChange}
                    />
                </div>
                {cardError && <div className="card-error">{cardError}</div>}
            </div>

            <div className="security-notice">
                <div className="security-icon">🔒</div>
                <div className="security-text">
                    <p>お客様のカード情報は暗号化され、安全に処理されます。</p>
                    <p>当サービスではカード情報を保存しません。</p>
                </div>
            </div>

            <button
                type="submit"
                disabled={!stripe || !cardComplete || isLoading}
                className={`payment-submit-btn ${isLoading ? 'loading' : ''}`}
            >
                {isLoading ? (
                    <>
                        <div className="spinner"></div>
                        処理中...
                    </>
                ) : (
                    userData.plan === 'free' ? 'アカウントを作成' : `${planInfo.name}を開始`
                )}
            </button>
        </form>
    );
};

// メインのStripePaymentFormコンポーネント
const StripePaymentForm = ({ userData, onSuccess, onError }) => {
    const [stripePromise, setStripePromise] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const initStripe = async () => {
            try {
                // 設定からStripe公開キーを取得
                const response = await fetch('/config');
                const config = await response.json();
                
                if (config.STRIPE_PUBLISHABLE_KEY) {
                    setStripePromise(loadStripe(config.STRIPE_PUBLISHABLE_KEY));
                } else {
                    console.error('Stripe publishable key not found in config');
                    onError('決済システムの初期化に失敗しました');
                }
            } catch (error) {
                console.error('Failed to load Stripe config:', error);
                onError('決済システムの初期化に失敗しました');
            }
        };

        initStripe();
    }, [onError]);

    if (!stripePromise) {
        return (
            <div className="stripe-loading">
                <div className="spinner"></div>
                <p>決済システムを読み込み中...</p>
            </div>
        );
    }

    return (
        <Elements stripe={stripePromise}>
            <PaymentForm
                userData={userData}
                onSuccess={onSuccess}
                onError={onError}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
            />
        </Elements>
    );
};

export default StripePaymentForm;