
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircle, AlertCircle, Home } from 'lucide-react';
import { db } from '../../services/database';
import { supabase } from '../../services/supabase';

export const BookingSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    const appointmentId = searchParams.get('appointment_id');
    const subscriptionId = searchParams.get('subscription_id');
    const type = searchParams.get('type');
    const paymentStatus = searchParams.get('collection_status'); // 'approved' from MP

    useEffect(() => {
        const updatePayment = async () => {
            if (!appointmentId && !subscriptionId) {
                setStatus('error');
                return;
            }

            if (paymentStatus === 'approved') {
                try {
                    if (type === 'subscription' && subscriptionId) {
                        // Update subscription status
                        await supabase
                            .from('customer_subscriptions')
                            .update({
                                status: 'active',
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', subscriptionId);
                    } else if (appointmentId) {
                        // Update appointment payment status
                        await supabase
                            .from('appointments')
                            .update({
                                payment_status: 'approved',
                                payment_id: searchParams.get('preference_id') || 'mock_id'
                            })
                            .eq('id', appointmentId);
                    }

                    setStatus('success');
                } catch (error) {
                    console.error('Error updating payment:', error);
                    setStatus('error');
                }
            } else {
                setStatus('success'); // Just a confirmation page if manually navigated or pending
            }
        };

        updatePayment();
    }, [appointmentId, subscriptionId, paymentStatus, type]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full text-center p-8">
                {status === 'loading' && <p>Confirmando pagamento...</p>}

                {status === 'success' && (
                    <div className="space-y-6">
                        <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle size={40} className="text-green-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">
                            {type === 'subscription' ? 'Assinatura Ativada!' : 'Agendamento Confirmado!'}
                        </h1>
                        <p className="text-textMuted">
                            {type === 'subscription' 
                                ? 'Sua assinatura foi ativada com sucesso. Aproveite seus benefícios!' 
                                : 'Seu pagamento foi confirmado e o horário está reservado.'}
                        </p>
                        <Button 
                            onClick={() => navigate(type === 'subscription' ? '/customer/subscriptions' : '/customer/appointments')} 
                            className="w-full"
                        >
                            {type === 'subscription' ? 'Voltar para Assinaturas' : 'Ver Meus Agendamentos'}
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6">
                        <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                            <AlertCircle size={40} className="text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Ops!</h1>
                        <p className="text-textMuted">
                            Houve um problema ao confirmar seu pagamento, mas seu agendamento pode ter sido criado.
                            Verifique seus agendamentos.
                        </p>
                        <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                            <Home size={16} className="mr-2" />
                            Voltar ao Início
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};
