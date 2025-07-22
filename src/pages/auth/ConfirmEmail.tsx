import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ConfirmEmail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [message, setMessage] = useState<string>('Confirmando seu email, aguarde...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function confirmEmail() {
      const queryParams = new URLSearchParams(location.search);
      const code = queryParams.get('code');

      if (!code) {
        setMessage('Código de confirmação ausente na URL.');
        setIsLoading(false);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        const response = await fetch('/api/auth/confirm-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error('Erro ao confirmar email');
        }

        setMessage('Email confirmado com sucesso! Você será redirecionado para o login.');
        setIsLoading(false);
        setTimeout(() => navigate('/login'), 3000);
      } catch (error) {
        setMessage(`Erro ao confirmar email: ${(error as Error).message}`);
        setIsLoading(false);
        setTimeout(() => navigate('/login'), 5000);
      }
    }

    confirmEmail();
  }, [location.search, navigate]);

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-md shadow-md text-center">
      <h1 className="text-xl font-semibold mb-4">Confirmação de Email</h1>
      <p className="mb-6 text-gray-700">{message}</p>
      {isLoading && (
        <svg
          className="animate-spin mx-auto h-8 w-8 text-primary-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
      )}
    </div>
  );
};

export default ConfirmEmail;