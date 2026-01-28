
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

export const RegisterSuccess: React.FC = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 mb-6 animate-bounce">
                    <CheckCircle size={40} className="text-green-500" />
                </div>
                <h1 className="text-3xl font-display font-bold text-white mb-4">Solicitação Enviada!</h1>
                <p className="text-zinc-400 mb-8 text-lg">
                    Sua barbearia foi pré-cadastrada com sucesso. Nossa equipe irá analisar sua solicitação e liberar o acesso em breve.
                </p>
                <Link to="/login">
                    <Button className="w-full">
                        Voltar para Login
                    </Button>
                </Link>
            </div>
        </div>
    );
};
