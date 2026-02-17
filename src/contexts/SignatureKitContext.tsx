import React, { createContext, useContext, ReactNode } from 'react';

interface SignatureKitConfig {
    apiKey: string;
    apiBaseUrl?: string; // Defaults to '/api'
    customerId?: string; // Optional customer ID for multi-tenant scenarios
}

const SignatureKitContext = createContext<SignatureKitConfig | undefined>(undefined);

interface SignatureKitProviderProps extends SignatureKitConfig {
    children: ReactNode;
}

export const SignatureKitProvider: React.FC<SignatureKitProviderProps> = ({
    apiKey,
    apiBaseUrl,
    customerId,
    children,
}) => {
    return (
        <SignatureKitContext.Provider value={{ apiKey, apiBaseUrl, customerId }}>
            {children}
        </SignatureKitContext.Provider>
    );
};

export const useSignatureKit = (): Partial<SignatureKitConfig> => {
    const context = useContext(SignatureKitContext);
    // Context is optional, components should fallback to props
    return context || {};
};
