import React from 'react';
import { Leaf } from 'lucide-react';

export function MyReports() {
  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-12 min-h-[80vh] flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center mb-6">
        <Leaf className="w-10 h-10 text-text-muted" />
      </div>
      <h2 className="text-2xl font-bold text-text mb-2">No reports yet</h2>
      <p className="text-text-muted mb-8 max-w-md">
        You haven't reported any garbage yet. Help keep your community clean by submitting your first report!
      </p>
    </div>
  );
}
