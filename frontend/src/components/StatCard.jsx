import React from 'react';

export default function StatCard({ title, value, icon: Icon, change, subtitle, color = 'orange' }) {
  const colorStyles = {
    orange: 'from-brand-orange-dark/20 to-brand-orange/5 border-brand-orange/30 text-brand-orange',
    gold: 'from-brand-gold-dark/20 to-brand-gold/5 border-brand-gold/30 text-brand-gold',
    emerald: 'from-emerald-900/30 to-emerald-600/5 border-emerald-500/30 text-emerald-400',
    blue: 'from-blue-900/30 to-blue-600/5 border-blue-500/30 text-blue-400',
    red: 'from-red-900/30 to-red-600/5 border-red-500/30 text-red-400',
  };

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-charcoal-900 border ${colorStyles[color]} relative overflow-hidden group hover:border-cream-400/40 transition-all duration-300 shadow-lg shadow-black/20`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-cream-300 uppercase tracking-wider">{title}</p>
        <div className={`p-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700/60 shadow-inner group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <h3 className="text-2xl sm:text-3xl font-bold font-serif text-cream-50 tracking-tight">
          {value}
        </h3>
        {(subtitle || change) && (
          <p className="mt-1 text-xs text-cream-400/80 flex items-center space-x-1">
            {change && <span className="text-emerald-400 font-semibold">{change}</span>}
            <span>{subtitle}</span>
          </p>
        )}
      </div>
    </div>
  );
}
