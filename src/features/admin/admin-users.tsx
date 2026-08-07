import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import apiClient, { getApiErrorMessage } from "../../shared/api/client";
import { queryKeys } from "../../shared/api/query-keys";
import Badge from "../../shared/components/badge";
import Button from "../../shared/components/button";
import EmptyState from "../../shared/components/empty-state";
import ErrorState from "../../shared/components/error-state";
import Input from "../../shared/components/input";
import Modal from "../../shared/components/modal";
import Select from "../../shared/components/select";
import { useToast } from "../../shared/components/toast";
import { useAuth } from "../auth/auth-context";
import AdminPagination from "./admin-pagination";
import type { PagedResponse, User } from "../../types";

const pageFrom = (value: string | null) => Math.max(1, Number(value) || 1);
const date = (value?: string) =>
  value ? new Date(value).toLocaleString() : "Never";

const AdminUsers: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [target, setTarget] = useState<User | null>(null);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const page = pageFrom(params.get("page"));
  const size = Number(params.get("size")) || 20;
  const status = params.get("active") ?? "";
  const emailVerified = params.get("emailVerified") ?? "";
  const role = params.get("role") ?? "";
  const sort = params.get("sort") ?? "createdAt";
  const direction = params.get("direction") ?? "desc";
  const filters = {
    page: page - 1,
    size,
    search: params.get("search") || undefined,
    active: status || undefined,
    emailVerified: emailVerified || undefined,
    role: role || undefined,
    sort,
    direction,
  };
  useEffect(() => {
    if (search === (params.get("search") ?? "")) return;
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(params);
      if (search.trim()) next.set("search", search.trim());
      else next.delete("search");
      next.set("page", "1");
      setParams(next, { replace: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, params, setParams]);
  const { data, isLoading, isError, refetch } = useQuery<PagedResponse<User>>({
    queryKey: queryKeys.adminUsers(filters),
    queryFn: () =>
      apiClient
        .get("/api/admin/users", { params: filters })
        .then((response) => response.data),
  });
  useEffect(() => {
    if (data && data.totalPages > 0 && page > data.totalPages) {
      const next = new URLSearchParams(params);
      next.set("page", String(data.totalPages));
      setParams(next, { replace: true });
    }
  }, [data, page, params, setParams]);
  const mutation = useMutation({
    mutationFn: (user: User) =>
      apiClient.post(
        `/api/admin/users/${user.id}/${user.isActive ? "disable" : "enable"}`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      toast("Account updated", "success");
      setTarget(null);
    },
    onError: (error: unknown) =>
      toast(getApiErrorMessage(error, "Unable to update account"), "error"),
  });
  const update = (key: string, value: string, reset = true) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (reset) next.set("page", "1");
    setParams(next);
  };
  const users = data?.content ?? [];
  return (
    <section>
      <h1 className="text-xl font-semibold">Accounts</h1>
      <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
        <Input
          aria-label="Search users"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Name or email"
        />
        <Select
          aria-label="Account status"
          value={status}
          onChange={(event) => update("active", event.target.value)}
          options={[
            { value: "", label: "All statuses" },
            { value: "true", label: "Active" },
            { value: "false", label: "Disabled" },
          ]}
        />
        <Select
          aria-label="Email verification"
          value={emailVerified}
          onChange={(event) => update("emailVerified", event.target.value)}
          options={[
            { value: "", label: "All email states" },
            { value: "true", label: "Verified" },
            { value: "false", label: "Unverified" },
          ]}
        />
        <Select
          aria-label="System role"
          value={role}
          onChange={(event) => update("role", event.target.value)}
          options={[
            { value: "", label: "All roles" },
            { value: "USER", label: "User" },
            { value: "SYSTEM_ADMIN", label: "System admin" },
          ]}
        />
        <Select
          aria-label="Sort accounts"
          value={sort}
          onChange={(event) => update("sort", event.target.value)}
          options={[
            { value: "createdAt", label: "Created" },
            { value: "lastLoginAt", label: "Last login" },
            { value: "fullName", label: "Name" },
          ]}
        />
        <Select
          aria-label="Sort direction"
          value={direction}
          onChange={(event) => update("direction", event.target.value)}
          options={[
            { value: "desc", label: "Newest first" },
            { value: "asc", label: "Oldest first" },
          ]}
        />
        <Select
          aria-label="Page size"
          value={String(size)}
          onChange={(event) => update("size", event.target.value)}
          options={[
            { value: "20", label: "20 per page" },
            { value: "50", label: "50 per page" },
            { value: "100", label: "100 per page" },
          ]}
        />
      </div>
      <div className="mt-5 overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            Loading accounts...
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : users.length === 0 ? (
          <EmptyState title="No accounts found" />
        ) : (
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 dark:border-slate-800">
                <th className="px-4 py-3">Account</th>
                <th>Email verification</th>
                <th>Status</th>
                <th>System role</th>
                <th>Last login</th>
                <th>Created</th>
                <th scope="col" aria-label="Account actions" />
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-slate-800"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/users/${item.id}${params.toString() ? `?${params}` : ""}`}
                      className="font-medium hover:text-indigo-600"
                    >
                      {item.fullName}
                    </Link>
                    <div className="text-xs text-zinc-500">{item.email}</div>
                  </td>
                  <td>
                    <Badge variant={item.emailVerified ? "success" : "default"}>
                      {item.emailVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={item.isActive ? "success" : "danger"}>
                      {item.isActive ? "Active" : "Disabled"}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      variant={
                        item.systemRole === "SYSTEM_ADMIN" ? "info" : "default"
                      }
                    >
                      {item.systemRole}
                    </Badge>
                  </td>
                  <td>{date(item.lastLoginAt)}</td>
                  <td>{date(item.createdAt)}</td>
                  <td className="px-4 py-3">
                    {item.id === currentUser?.id ? null : (
                      <Button
                        aria-label={`${item.isActive ? "Disable" : "Enable"} ${item.fullName}`}
                        variant={item.isActive ? "danger" : "outline"}
                        size="sm"
                        onClick={() => setTarget(item)}
                      >
                        {item.isActive ? "Disable" : "Enable"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {data && (
        <AdminPagination
          data={data}
          page={page}
          label="accounts"
          onPageChange={(value) => update("page", String(value), false)}
        />
      )}
      <Modal
        isOpen={!!target}
        onClose={() => setTarget(null)}
        title={`${target?.isActive ? "Disable" : "Enable"} account`}
      >
        <p className="text-sm text-zinc-600">
          {target?.isActive
            ? `Disable ${target.fullName}'s account? Existing sessions will be revoked.`
            : `Enable ${target?.fullName}'s account?`}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setTarget(null)}>
            Cancel
          </Button>
          <Button
            aria-label={`${target?.isActive ? "Disable" : "Enable"} account`}
            variant={target?.isActive ? "danger" : "primary"}
            isLoading={mutation.isPending}
            onClick={() => target && mutation.mutate(target)}
          >
            {target?.isActive ? "Disable" : "Enable"}
          </Button>
        </div>
      </Modal>
    </section>
  );
};

export default AdminUsers;
