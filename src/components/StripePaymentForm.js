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

    // デバッグ用のログ
    useEffect(() => {
        console.log('PaymentForm mounted - stripe:', stripe ? 'Ready' : 'Not ready');
        console.log('PaymentForm mounted - elements:', elements ? 'Ready' : 'Not ready');
    }, [stripe, elements]);

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

    // フリープラン: 2段階処理（ユーザー作成→支払い方法保存）
    const handleFreePaymentMethod = async (card) => {
        // ステップ1: ユーザー作成（statusはpendingで作成）
        const userCreateResponse = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...userData,
                status: 'pending' // カード登録前はpending
            }),
        });

        const userCreateResult = await userCreateResponse.json();

        if (!userCreateResponse.ok) {
            throw new Error(userCreateResult.error || 'ユーザー作成に失敗しました');
        }

        const user_id = userCreateResult.user_id;

        // ステップ2: PaymentMethodを作成
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

        // ステップ3: バックエンドに支払い方法を保存
        const response = await fetch('/api/payments/save-payment-method', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: user_id,
                payment_method_id: paymentMethod.id
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

    // 有料プラン: 2段階処理（ユーザー作成→サブスクリプション作成）
    const handlePaidSubscription = async (card) => {
        // ステップ1: ユーザー作成（statusはpendingで作成）
        const userCreateResponse = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...userData,
                status: 'pending' // カード登録前はpending
            }),
        });

        const userCreateResult = await userCreateResponse.json();

        if (!userCreateResponse.ok) {
            throw new Error(userCreateResult.error || 'ユーザー作成に失敗しました');
        }

        const user_id = userCreateResult.user_id;

        // ステップ2: PaymentMethodを作成
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

        // ステップ3: バックエンドでサブスクリプション作成
        const response = await fetch('/api/payments/create-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: user_id,
                payment_method_id: paymentMethod.id,
                plan: userData.plan
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
        console.log('CardElement change event:', {
            complete: event.complete,
            error: event.error ? event.error.message : null,
            elementType: event.elementType,
            empty: event.empty
        });
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
                        onReady={() => {
                            console.log('CardElement is ready!');
                        }}
                        onFocus={() => {
                            console.log('CardElement focused');
                        }}
                        onBlur={() => {
                            console.log('CardElement blurred');
                        }}
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
                let stripePublishableKey = '';
                
                // まず/configから取得を試行
                try {
                    console.log('Fetching Stripe config from /config...');
                    const response = await fetch('/config');
                    const config = await response.json();
                    stripePublishableKey = config.stripePublishableKey;
                    console.log('Stripe key loaded from config:', stripePublishableKey ? `Found: ${stripePublishableKey.substring(0, 10)}...` : 'Not found');
                } catch (configError) {
                    console.error('Failed to fetch config:', configError);
                    // フォールバック：環境変数から取得（ビルド時の値）
                    stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
                    console.log('Using fallback Stripe key:', stripePublishableKey ? `Found: ${stripePublishableKey.substring(0, 10)}...` : 'Not found');
                }
                
                if (stripePublishableKey) {
                    console.log('Loading Stripe with key:', stripePublishableKey.substring(0, 10) + '...');
                    const stripeInstance = loadStripe(stripePublishableKey);
                    console.log('Stripe loadStripe called, setting promise...');
                    setStripePromise(stripeInstance);
                    
                    // Stripeの実際の初期化を確認
                    stripeInstance.then(stripe => {
                        console.log('Stripe initialized successfully:', stripe ? 'Success' : 'Failed');
                        if (!stripe) {
                            console.error('Stripe instance is null after initialization');
                            onError('決済システムの初期化に失敗しました');
                        }
                    }).catch(error => {
                        console.error('Stripe initialization error:', error);
                        onError('決済システムの初期化に失敗しました');
                    });
                } else {
                    console.error('Stripe publishable key not found');
                    onError('決済システムの初期化に失敗しました');
                }
            } catch (error) {
                console.error('Failed to initialize Stripe:', error);
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