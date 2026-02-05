
import React from 'react';

export const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="max-w-2xl mx-auto px-4 py-8 min-h-screen flex flex-col">
    {children}
  </div>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl shadow-xl overflow-hidden ${className}`}>
    {children}
  </div>
);

export const Button: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
}> = ({ children, onClick, disabled, variant = 'primary', className = "" }) => {
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-100",
    danger: "bg-rose-600 hover:bg-rose-500 text-white",
    ghost: "bg-transparent border border-slate-700 hover:bg-slate-800 text-slate-300"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`px-6 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};
