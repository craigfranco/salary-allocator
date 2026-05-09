import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SearchBar({ search, setSearch, department, setDepartment, allocationFilter, setAllocationFilter }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search employees, titles…"
          className="w-full pl-9 pr-8 h-9 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <select
        value={department}
        onChange={e => setDepartment(e.target.value)}
        className="h-9 px-3 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
      >
        <option value="">All Departments</option>
        <option value="REVENUE">Revenue</option>
        <option value="ECOMM">E-Commerce</option>
        <option value="SALES">Sales</option>
      </select>

      <select
        value={allocationFilter}
        onChange={e => setAllocationFilter(e.target.value)}
        className="h-9 px-3 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
      >
        <option value="">All Allocations</option>
        <option value="exact">100% Allocated</option>
        <option value="issues">Has Issues</option>
        <option value="suppressed">Suppressed</option>
      </select>
    </div>
  );
}