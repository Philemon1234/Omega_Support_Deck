import Papa from "papaparse";
import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { FiEdit2, FiTrash2, FiUpload, FiUser, FiUserPlus, FiX } from "react-icons/fi";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { useAppContext, type Customer, type ImportCustomersSummary } from "../context/AppContext";
import { mapCsvRowToCustomer } from "../utils/csvImport";

type OutletContext = { search: string };
const PAGE_SIZE = 10;

function getPaginationItems(currentPage: number, totalPages: number) {
  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage - 2, currentPage + 1, currentPage + 2]);
  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  return sorted.reduce<Array<number | "ellipsis">>((items, page, index) => {
    const previous = sorted[index - 1];
    if (previous && page - previous > 1) items.push("ellipsis");
    items.push(page);
    return items;
  }, []);
}

export function Customers() {
  const { search } = useOutletContext<OutletContext>();
  const { customers, addCustomer, importCustomers, deleteCustomer, deleteCustomersBulk, updateCustomer, refreshCustomers, apiError, isLoading } = useAppContext();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [alert, setAlert] = useState("");
  const [importSummary, setImportSummary] = useState<ImportCustomersSummary | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      refreshCustomers(search).catch((error) => {
        setAlert(error instanceof Error ? error.message : "Unable to search customers.");
      });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [refreshCustomers, search]);

  const filteredCustomers = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return customers;
    return customers.filter(
      (customer) => customer.name.toLowerCase().includes(query) || customer.phone.toLowerCase().includes(query),
    );
  }, [customers, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const visibleCustomers = filteredCustomers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const visibleIds = visibleCustomers.map((customer) => customer.id);
  const selectedVisibleCount = visibleIds.filter((id) => selectedIds.includes(id)).length;
  const allVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
  const someVisibleSelected = selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;
  const paginationItems = getPaginationItems(page, totalPages);
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected]);

  const handleAdd = async () => {
    setIsSaving(true);
    const result = await addCustomer(name, phone);
    setIsSaving(false);
    if (!result.ok) {
      setAlert(result.error);
      return;
    }
    setAlert("");
    setName("");
    setPhone("");
    setPage(1);
  };

  const startEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditName(customer.name);
    setEditPhone(customer.phone);
    setAlert("");
  };

  const saveEdit = async () => {
    if (!editingCustomer) return;
    setIsSaving(true);
    const result = await updateCustomer(editingCustomer.id, editName, editPhone);
    setIsSaving(false);
    if (!result.ok) {
      setAlert(result.error);
      return;
    }
    setEditingCustomer(null);
    setAlert("");
  };

  const confirmDelete = (customer: Customer) => {
    if (window.confirm(`Delete ${customer.name}?`)) {
      deleteCustomer(customer.id).catch((error) => {
        setAlert(error instanceof Error ? error.message : "Unable to delete customer.");
      });
    }
  };

  const toggleCustomer = (id: number) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]));
  };

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }
      return Array.from(new Set([...current, ...visibleIds]));
    });
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCustomersBulk(selectedIds);
      setSelectedIds([]);
      setShowBulkConfirm(false);
      setAlert("");
    } catch (error) {
      setAlert(error instanceof Error ? error.message : "Unable to delete selected customers.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImportFile = (file: File) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        try {
          setIsImporting(true);
          const mappedRows = result.data.map((row) => mapCsvRowToCustomer(row));
          const parseInvalidRows = result.errors.length;
          const summary = await importCustomers([
            ...mappedRows,
            ...Array.from({ length: parseInvalidRows }, () => null),
          ]);

          setImportSummary(summary);
          setAlert("");
          setPage(1);
        } catch (error) {
          setImportSummary(null);
          setAlert(error instanceof Error ? error.message : "CSV import failed. Please check the file and try again.");
        } finally {
          setIsImporting(false);
        }
      },
      error: () => {
        setImportSummary(null);
        setAlert("CSV import failed. Please check the file and try again.");
      },
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.55fr_.75fr]">
      <Card className="overflow-hidden p-6">
        {apiError && (
          <div className="mb-5">
            <Alert message={apiError} />
          </div>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Customer List</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                handleImportFile(file);
              }
              event.target.value = "";
            }}
          />
          <Button
            variant="secondary"
            className="border-green-200 text-green-700 hover:bg-green-50"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            <FiUpload className="h-4 w-4" />
            {isImporting ? "Importing..." : "Import CSV"}
          </Button>
        </div>
        <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200">
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-700">{selectedIds.length} customers selected</p>
              <Button variant="danger" className="border border-red-200 bg-white" onClick={() => setShowBulkConfirm(true)}>
                <FiTrash2 />
                Delete Selected
              </Button>
            </div>
          )}
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-4 font-medium">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-green-600 focus:ring-green-500"
                    aria-label="Select all visible customers"
                  />
                </th>
                <th className="px-4 py-4 font-medium">Name</th>
                <th className="px-4 py-4 font-medium">Phone Number</th>
                <th className="px-4 py-4 font-medium">Date Added</th>
                <th className="px-4 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(customer.id)}
                      onChange={() => toggleCustomer(customer.id)}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 text-green-600 focus:ring-green-500"
                      aria-label={`Select ${customer.name}`}
                    />
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    <span className="inline-flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600">
                        <FiUser className="h-5 w-5" />
                      </span>
                      {customer.name}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-700">{customer.phone}</td>
                  <td className="px-4 py-4 text-slate-600">{customer.dateAdded}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => startEdit(customer)}
                        className="inline-flex cursor-pointer items-center gap-1.5 font-medium text-green-600 hover:text-green-700"
                      >
                        <FiEdit2 /> Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(customer)}
                        className="inline-flex cursor-pointer items-center gap-1.5 font-medium text-red-600 hover:text-red-700"
                      >
                        <FiTrash2 /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!visibleCustomers.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center font-semibold text-slate-500">
                    {isLoading ? "Loading customers..." : apiError ? "Start the backend API to load customers." : "No customers match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-slate-500">
          <span>
            {filteredCustomers.length
              ? `Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, filteredCustomers.length)} of ${filteredCustomers.length} customers`
              : "No customers to show"}
          </span>
          <span>Page {page} of {totalPages}</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Button variant="secondary" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            Previous
          </Button>
          {paginationItems.map((item, index) => (
            item === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="px-1 text-slate-400">...</span>
            ) : (
              <button
                key={item}
                onClick={() => setPage(item)}
                className={`h-11 min-w-11 cursor-pointer rounded-xl border px-3 text-sm font-medium ${
                  page === item
                    ? "border-green-300 bg-green-50 text-green-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item}
              </button>
            )
          ))}
          <Button
            variant="secondary"
            disabled={page === totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Next
          </Button>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-7">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Add New Customer</h2>
          <div className="mt-7 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-900">Customer Name</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter customer name" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-900">Phone Number</span>
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Enter phone number" />
            </label>
            <p className="text-sm font-medium text-slate-500">Only name and phone number are required.</p>
            <Button className="w-full py-4 text-base" onClick={handleAdd} disabled={isSaving}>
              <FiUserPlus className="h-5 w-5" />
              {isSaving ? "Adding..." : "Add Customer"}
            </Button>
          </div>
        </Card>

        {alert && <Alert message={alert} />}

        {importSummary && (
          <Card className="border-green-200 bg-green-50/50 p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                <FiUpload className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Import completed</h3>
                <div className="mt-3 space-y-1 text-sm font-semibold text-slate-700">
                  <p>{importSummary.added} customers added</p>
                  <p>{importSummary.duplicates} duplicate numbers skipped</p>
                  <p>{importSummary.invalid} invalid rows skipped</p>
                </div>
                {importSummary.duplicatePhones.length > 0 && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm font-medium text-amber-800">Duplicate skipped:</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {importSummary.duplicatePhones.slice(0, 6).map((phoneNumber) => (
                        <span key={phoneNumber} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-700">
                          {phoneNumber}
                        </span>
                      ))}
                      {importSummary.duplicatePhones.length > 6 && (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-700">
                          +{importSummary.duplicatePhones.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>

      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-950">Edit Customer</h2>
              <button onClick={() => setEditingCustomer(null)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                <FiX />
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <Input value={editName} onChange={(event) => setEditName(event.target.value)} placeholder="Customer name" />
              <Input value={editPhone} onChange={(event) => setEditPhone(event.target.value)} placeholder="Phone number" />
              <div className="flex gap-3">
                <Button className="flex-1" onClick={saveEdit} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setEditingCustomer(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showBulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-slate-950">Delete Selected Customers</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              You are about to delete {selectedIds.length} selected customers. This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowBulkConfirm(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="danger" className="flex-1 border border-red-200 bg-red-600 text-white hover:bg-red-700" onClick={handleBulkDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Customers"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
