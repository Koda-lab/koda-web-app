"use client";

import { useEffect } from "react";

// Global error doit définir ses propres tags html et body car il remplace le root layout en cas de crash total
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html>
            <body>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    textAlign: 'center',
                    padding: '20px'
                }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
                        Une erreur critique est survenue
                    </h2>
                    <p style={{ color: '#666', marginBottom: '24px' }}>
                        Le chargement de l'application a échoué.
                    </p>
                    <button
                        onClick={() => reset()}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#000',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        Récharger l'application
                    </button>
                </div>
            </body>
        </html>
    );
}
