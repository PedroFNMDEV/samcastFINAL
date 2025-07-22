import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    async function handleAuthCallback() {
      const access_token = searchParams.get('access_token');
      const type = searchParams.get('type'); // pode ser 'signup' ou 'recovery'

      if (!access_token) {
        alert('Token não encontrado na URL.');
        navigate('/login');
        return;
      }

      // Validar token com o backend
      try {
        const response = await fetch('/api/auth/validate-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: access_token }),
        });

        if (!response.ok) {
          throw new Error('Token inválido');
        }

        if (type === 'recovery') {
          // Redireciona para a página de reset de senha
          navigate('/reset-password');
        } else if (type === 'signup') {
          alert('Email confirmado com sucesso! Você já pode fazer login.');
          navigate('/login');
        } else {
          // Outros tipos ou padrão: redirecionar para login
          navigate('/login');
        }
      } catch (error) {
        alert('Erro ao validar token: ' + (error as Error).message);
        navigate('/login');
      }
    }

    handleAuthCallback();
  }, [navigate, searchParams]);

  return <p>Processando autenticação, aguarde...</p>;
};

export default AuthCallback;