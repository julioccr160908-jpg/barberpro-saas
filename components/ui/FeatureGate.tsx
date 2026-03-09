import React from 'react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Lock, Crown } from 'lucide-react';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';

interface FeatureGateProps {
    children: React.ReactNode;
    requiredPlan: 'pro' | 'enterprise';
    title: string;
    description: string;
}

const PLAN_HIERARCHY = {
    basic: 0,
    pro: 1,
    enterprise: 2
};

export const FeatureGate: React.FC<FeatureGateProps> = ({ children, requiredPlan, title, description }) => {
    const { organization } = useOrganization();
    const navigate = useNavigate();

    const currentPlan = organization?.planType || 'basic';
    const hasAccess = PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[requiredPlan];

    if (hasAccess) {
        return <>{children}</>;
    }

    return (
        <div className="relative group">
            {/* Blurred Content */}
            <div className="opacity-0 blur-sm pointer-events-none transition-all duration-300 select-none" aria-hidden="true">
                {children}
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-background/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4 ring-4 ring-amber-500/10">
                    <Lock className="text-amber-400" size={32} />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                    <Crown size={20} className="text-amber-400" />
                    {title}
                </h3>
                
                <p className="text-textMuted max-w-sm mb-6">
                    {description}
                </p>

                <Button 
                    onClick={() => navigate('/admin/settings?tab=subscription')}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-lg shadow-amber-500/20"
                >
                    Fazer Upgrade para o plano {requiredPlan === 'pro' ? 'Pro' : 'Premium'}
                </Button>
            </div>
        </div>
    );
};
