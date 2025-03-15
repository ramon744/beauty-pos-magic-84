
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <h1 className="text-6xl font-bold text-sidebar-primary">404</h1>
        <h2 className="text-2xl font-semibold mt-4 mb-2">Página não encontrada</h2>
        <p className="text-muted-foreground mb-6">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="space-x-4">
          <Button asChild>
            <Link to="/dashboard">Voltar ao Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Ir para Login</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
