import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Plus, Search, ChevronLeft, ChevronRight, User, Edit2, CheckCircle2 } from "lucide-react";
import { useAdminClients, AdminClient } from "../../hooks/use-admin-clients";
import { useUpdateClient } from "../../hooks/use-admin-mutations";
import { Input } from "../../components/ui/input";
import { format } from "date-fns";
import { ErrorBoundary } from "../../components/shared/ErrorBoundary";
import { Skeleton } from "../../components/ui/skeleton";
import { Badge } from "../../components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../../components/ui/sheet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Label } from "../../components/ui/label";

const clientFormSchema = z.object({
  cnic: z.string().min(13, "CNIC must be at least 13 characters").max(15, "CNIC must be at most 15 characters").regex(/^[0-9-]+$/, "CNIC can only contain numbers and hyphens"),
  address: z.string().min(5, "Address must be at least 5 characters").max(200, "Address is too long"),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

function ClientsContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const [selectedClient, setSelectedClient] = useState<AdminClient | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading, isError, error } = useAdminClients(searchTerm, page, pageSize);
  const updateClientMutation = useUpdateClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0); // Reset to first page on search
  };

  const openClientDetails = (client: AdminClient) => {
    setSelectedClient(client);
    setIsEditing(false);
    reset({
      cnic: client.cnic || "",
      address: client.address || "",
    });
    setIsDrawerOpen(true);
  };

  const onSubmit = (values: ClientFormValues) => {
    if (!selectedClient) return;
    
    // Optimistic local update
    setSelectedClient({
      ...selectedClient,
      cnic: values.cnic,
      address: values.address
    });
    setIsEditing(false);

    updateClientMutation.mutate({
      id: selectedClient.id,
      cnic: values.cnic,
      address: values.address
    });
  };

  const activeDealsCount = (client: AdminClient) => 
    client.deals?.filter(d => d.status === 'ACTIVE').length || 0;

  if (isError) {
    throw error;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500">Manage all registered clients and their details.</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="rounded-md border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>CNIC</TableHead>
              <TableHead>Active Deals</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="bg-gray-100 p-3 rounded-full">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-base font-medium text-gray-900">No clients found</p>
                    <p className="text-sm text-gray-500">Try adjusting your search filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((client) => {
                const activeCount = activeDealsCount(client);
                return (
                  <TableRow key={client.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium text-gray-900">{client.profiles?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500 sm:hidden">{client.profiles?.email}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="text-sm">{client.profiles?.email}</div>
                      <div className="text-sm text-gray-500">{client.profiles?.phone || '--'}</div>
                    </TableCell>
                    <TableCell className="text-sm">{client.cnic || '--'}</TableCell>
                    <TableCell>
                      {activeCount > 0 ? (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
                          {activeCount} Active
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-500">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(client.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openClientDetails(client)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
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

      {/* Client Detail Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <SheetTitle>Client Details</SheetTitle>
                <SheetDescription>View extended information and history.</SheetDescription>
              </div>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </SheetHeader>
          
          {selectedClient && (
            <div className="space-y-8">
              {/* Profile Overview */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{selectedClient.profiles?.name}</h3>
                
                {isEditing ? (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cnic">CNIC</Label>
                      <Input id="cnic" {...register("cnic")} placeholder="12345-1234567-1" />
                      {errors.cnic && <p className="text-sm text-red-500">{errors.cnic.message}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" {...register("address")} placeholder="123 Main St..." />
                      {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <Button variant="ghost" type="button" onClick={() => setIsEditing(false)}>Cancel</Button>
                      <Button type="submit" disabled={updateClientMutation.isPending}>
                        {updateClientMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900 break-all">{selectedClient.profiles?.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedClient.profiles?.phone || '--'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">CNIC</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedClient.cnic || '--'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Address</dt>
                      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedClient.address || '--'}</dd>
                    </div>
                  </dl>
                )}
              </div>

              {/* Deal History Summary */}
              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Deal History Summary</h4>
                {selectedClient.deals && selectedClient.deals.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Deals</span>
                      <span className="font-medium">{selectedClient.deals.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Active Deals</span>
                      <span className="font-medium text-blue-600">{activeDealsCount(selectedClient)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No deals found for this client.</p>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function AdminClients() {
  return (
    <ErrorBoundary>
      <ClientsContent />
    </ErrorBoundary>
  );
}
