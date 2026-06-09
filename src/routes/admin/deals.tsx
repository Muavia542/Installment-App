import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Plus, Search, ChevronLeft, ChevronRight, FileText, Calendar, DollarSign } from "lucide-react";
import { useAdminDeals, AdminDeal } from "../../hooks/use-admin-deals";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Progress } from "../../components/ui/progress";
import { format, isPast, isToday } from "date-fns";
import { ErrorBoundary } from "../../components/shared/ErrorBoundary";
import { Skeleton } from "../../components/ui/skeleton";
import { RecordPaymentDialog } from "../../components/admin/RecordPaymentDialog";

function DealsContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const pageSize = 10;
  
  const [paymentDeal, setPaymentDeal] = useState<AdminDeal | null>(null);

  const { data, isLoading, isError, error } = useAdminDeals(searchTerm, statusFilter, page, pageSize);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setPage(0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">Active</Badge>;
      case 'COMPLETED': return <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">Completed</Badge>;
      case 'DEFAULTED': return <Badge variant="destructive" className="bg-red-50 text-red-700 hover:bg-red-50">Defaulted</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateProgress = (deal: AdminDeal) => {
    if (deal.total_amount <= 0) return 0;
    const paid = deal.total_amount - deal.remaining_amount;
    return Math.min(Math.round((paid / deal.total_amount) * 100), 100);
  };

  const getNextPaymentDate = (deal: AdminDeal) => {
    const pendingInstallments = deal.installments?.filter(i => i.status === 'PENDING') || [];
    if (pendingInstallments.length === 0) return null;
    
    // Sort by due date ascending
    const sorted = [...pendingInstallments].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    return sorted[0];
  };

  if (isError) {
    throw error;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Deals Dashboard</h1>
          <p className="text-sm text-gray-500">Track installment progress, next payments, and overall balance.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by product name..."
            className="pl-9"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="DEFAULTED">Defaulted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Product / Balance</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Next Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20 mt-2" /></TableCell>
                  <TableCell><Skeleton className="h-2 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                   <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="bg-gray-100 p-3 rounded-full">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-base font-medium text-gray-900">No deals found</p>
                    <p className="text-sm text-gray-500">No installment contracts match your current filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((deal) => {
                const progress = calculateProgress(deal);
                const nextPayment = getNextPaymentDate(deal);
                const isLate = nextPayment && (isPast(new Date(nextPayment.due_date)) && !isToday(new Date(nextPayment.due_date)));
                
                return (
                  <TableRow key={deal.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">
                      {deal.clients?.profiles?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{deal.product_name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Rem: <span className="font-medium text-gray-900">${deal.remaining_amount.toLocaleString()}</span> of ${deal.total_amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress value={progress} className="w-24 h-2 bg-gray-100" />
                        <span className="text-xs text-gray-500 font-medium">{progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {nextPayment ? (
                        <div className="flex flex-col gap-1">
                          <div className={`flex items-center text-sm font-medium ${isLate ? 'text-red-600' : 'text-gray-900'}`}>
                            <Calendar className="mr-1.5 h-3.5 w-3.5" />
                            {format(new Date(nextPayment.due_date), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-gray-500 pl-5">
                            ${Number(nextPayment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} due
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 italic">No pending payments</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(deal.status)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {deal.status === 'ACTIVE' && (
                        <Button variant="outline" size="sm" onClick={() => setPaymentDeal(deal)}>
                          <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                          Pay
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.count > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium">{page * pageSize + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min((page + 1) * pageSize, data.count)}
            </span>{" "}
            of <span className="font-medium">{data.count}</span> results
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * pageSize >= data.count || isLoading}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {paymentDeal && (
        <RecordPaymentDialog
          dealId={paymentDeal.id}
          clientUserId={paymentDeal.clients?.user_id || ''}
          clientName={paymentDeal.clients?.profiles?.name || 'Unknown'}
          productName={paymentDeal.product_name}
          remainingAmount={paymentDeal.remaining_amount}
          isOpen={!!paymentDeal}
          onOpenChange={(open) => {
            if (!open) setPaymentDeal(null);
          }}
        />
      )}
    </div>
  );
}

export function AdminDeals() {
  return (
    <ErrorBoundary>
      <DealsContent />
    </ErrorBoundary>
  );
}
