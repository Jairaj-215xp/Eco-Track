import React from 'react';
import { Leaf } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="max-w-[1080px] mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Leaf className="w-5 h-5 text-accent" />
            <span className="font-semibold text-text">Eco-Track</span>
          </div>
          
          <div className="text-sm text-text-muted text-center md:text-right">
            <p>Empowering communities to keep cities clean.</p>
            <p className="mt-1 flex items-center justify-center md:justify-end">
              Contributing to UN SDG 6
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
