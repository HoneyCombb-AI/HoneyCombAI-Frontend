"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { Building2, ChevronDown, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CompanyListItem } from "@/types/companies";

interface CompanyFilterDropdownProps {
  selectedCompanyId: string;
  selectedCompanyName: string;
  onCompanyChange: (company: CompanyListItem) => void;
  onCompanyClear: () => void;
}

export function CompanyFilterDropdown({
  selectedCompanyId,
  selectedCompanyName,
  onCompanyChange,
  onCompanyClear,
}: CompanyFilterDropdownProps) {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState<boolean>(false);
  const [companySearchInput, setCompanySearchInput] = useState<string>("");

  const normalizedSearch = companySearchInput.trim().toLowerCase();
  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(normalizedSearch)
  );

  useEffect(() => {
    if (companySearchInput.trim().length < 2) {
      setCompanies([]);
      setCompaniesLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setCompaniesLoading(true);
        const response = await axios.get('/api/companies', {
          params: {
            search: companySearchInput.trim(),
            limit: 20,
            page: 1,
            sortBy: 'name',
            sortOrder: 'asc',
          },
          signal: controller.signal,
        });
        setCompanies(response.data.companies || []);
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error("Failed to search companies:", error);
          toast.error("Failed to search companies");
        }
      } finally {
        if (!controller.signal.aborted) {
          setCompaniesLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [companySearchInput]);

  const handleCompanyChange = (company: CompanyListItem) => {
    onCompanyChange(company);
    setCompanySearchInput("");
  };

  const handleCompanyClear = () => {
    onCompanyClear();
    setCompanySearchInput("");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 text-sm ${selectedCompanyId ? "bg-blue-50 border-blue-300 text-blue-700" : ""}`}
        >
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">Company:</span>
          <span className="max-w-40 truncate">
            {selectedCompanyName || "Select"}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div
          className="p-2"
          onKeyDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search companies..."
              value={companySearchInput}
              onChange={(e) => setCompanySearchInput(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>
        {selectedCompanyId && (
          <DropdownMenuItem onSelect={handleCompanyClear}>
            <X className="h-4 w-4 mr-2" />
            Clear company
          </DropdownMenuItem>
        )}
        {companiesLoading ? (
          <div className="px-3 py-2 text-sm text-muted-foreground text-center">
            Loading companies...
          </div>
        ) : companySearchInput.trim().length < 2 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground text-center">
            Type at least 2 characters
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground text-center">
            No companies found
          </div>
        ) : (
          filteredCompanies.slice(0, 50).map((company) => (
            <DropdownMenuItem
              key={company.id}
              onSelect={() => handleCompanyChange(company)}
            >
              <Building2 className="h-4 w-4 mr-2" />
              <span className="truncate">{company.name}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
