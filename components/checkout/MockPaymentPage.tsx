
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader2, CheckCircle, CreditCard, Lock } from 'lucide-react';

export const MockPaymentPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const amount = searchParams.get('amount');
    const title = searchParams.get('title');
    const preferenceId = searchParams.get('preference_id');

    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    const handlePayment = () => {
        setProcessing(true);
        // Simulate network delay
        setTimeout(() => {
            setProcessing(false);
            setSuccess(true);

            // Redirect back to app after success
            setTimeout(() => {
                // In a real flow, MP redirects to the back_urls.
                // We simulate this by going to /booking/success?status=approved
                navigate(`/booking/success?collection_status=approved&preference_id=${preferenceId}`);
            }, 2000);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white border-0 shadow-xl text-black">
                <div className="p-8 text-center space-y-6">
                    {/* Header */}
                    <div className="flex justify-center mb-4">
                        <div className="bg-blue-500 rounded-full p-3">
                            <CreditCard size={32} className="text-white" />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold font-sans text-gray-800">Checkout Simulado</h2>
                        <p className="text-sm text-gray-500 mt-1">Isso é um ambiente de teste.</p>
                    </div>

                    {/* Order Details */}
                    <div className="bg-gray-50 p-4 rounded-lg text-left border border-gray-200">
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Produto:</span>
                            <span className="font-medium text-gray-900">{title}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                            <span className="font-bold text-gray-800">Total:</span>
                            <span className="font-bold text-green-600 text-lg">R$ {Number(amount).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    {!success ? (
                        <div className="space-y-3">
                            <Button
                                onClick={handlePayment}
                                disabled={processing}
                                className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" />
                                        Processando...
                                    </>
                                ) : (
                                    'Pagar Agora'
                                )}
                            </Button>
                            <p className="text-xs text-gray-400 flex items-center justify-center">
                                <Lock size={12} className="mr-1" />
                                Ambiente Seguro (Simulado)
                            </p>
                        </div>
                    ) : (
                        <div className="animate-fade-in text-center space-y-4">
                            <div className="text-green-500 flex justify-center">
                                <CheckCircle size={48} />
                            </div>
                            <h3 className="text-xl font-bold text-green-600">Pagamento Aprovado!</h3>
                            <p className="text-gray-500">Redirecionando para a loja...</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
