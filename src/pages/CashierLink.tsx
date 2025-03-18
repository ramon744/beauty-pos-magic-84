
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageTransition } from '@/components/ui/PageTransition';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LinkIcon } from 'lucide-react';

const CashierLink = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  React.useEffect(() => {
    if (user && !hasPermission(['admin'])) {
      navigate('/dashboard');
    }
  }, [user, hasPermission, navigate]);

  return (
    <PageTransition>
      <div className="container py-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight flex items-center">
            <LinkIcon className="mr-2 h-8 w-8" />
            Vincular Caixa
          </h2>
          <p className="text-muted-foreground">
            Gerencie caixas e vinculações com funcionários
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Vincular Caixa</CardTitle>
              <CardDescription>Atribua caixas aos funcionários</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Este módulo permite que administradores criem caixas e os vinculem aos funcionários.
              </p>
              <div className="flex justify-end">
                <Button>Criar Vinculação</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Caixas</CardTitle>
              <CardDescription>Gerencie os caixas disponíveis</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Adicione, edite ou remova caixas do sistema.
              </p>
              <div className="flex justify-end">
                <Button>Gerenciar</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Relatórios</CardTitle>
              <CardDescription>Visualize relatórios de caixas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Acesse relatórios sobre operações de caixa e vinculações.
              </p>
              <div className="flex justify-end">
                <Button>Ver Relatórios</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};

export default CashierLink;
