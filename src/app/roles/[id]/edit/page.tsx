"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api, Role, Permission } from "@/lib/api";
import { 
  ShieldCheck, 
  ArrowLeft, 
  Save, 
  Check, 
  KeyRound, 
  AlertCircle,
  Clock,
  Layers,
  Sparkles
} from "lucide-react";

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [rolesRes, perms] = await Promise.all([
          api.getRoles({ limit: 100 }),
          api.getPermissions()
        ]);

        const role = rolesRes.data.find((r: Role) => r.id === roleId);
        if (!role) {
          setError(`Role dengan ID "${roleId}" tidak ditemukan.`);
          setLoading(false);
          return;
        }

        setName(role.name);
        setDescription(role.description || "");
        setAvailablePermissions(perms || []);
        
        // Match permissions: if role.permissions contains codes or IDs, match them
        const permIds = (perms || [])
          .filter(p => (role.permissions || []).includes(p.code) || (role.permissions || []).includes(p.id))
          .map(p => p.id);

        setSelectedPermIds(permIds);
      } catch (err: any) {
        setError(err.message || "Gagal memuat data role dan permissions dari server.");
      } finally {
        setLoading(false);
      }
    }

    if (roleId) {
      loadData();
    }
  }, [roleId]);

  const togglePermission = (permId: string) => {
    setSelectedPermIds(prev => 
      prev.includes(permId) 
        ? prev.filter(p => p !== permId) 
        : [...prev, permId]
    );
  };

  const handleSelectAll = () => {
    setSelectedPermIds(availablePermissions.map(p => p.id));
  };

  const handleClearAll = () => {
    setSelectedPermIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama role wajib diisi.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await api.updateRole(roleId, {
        name: name.trim(),
        description: description.trim(),
        permission_ids: selectedPermIds
      });

      setSuccess(true);
      setTimeout(() => {
        router.push(`/roles/${roleId}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui role ke gRPC backend.");
      setSaving(false);
    }
  };

  // Group permissions by module prefix
  const groupedPermissions = availablePermissions.reduce((acc, perm) => {
    const group = perm.module || perm.code.split(":")[0] || "general";
    if (!acc[group]) acc[group] = [];
    acc[group].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/5 animate-pulse" />
          <div className="space-y-1">
            <div className="w-48 h-6 bg-white/5 rounded animate-pulse" />
            <div className="w-64 h-3.5 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
        <div className="card-elevated p-8 space-y-6 animate-pulse">
          <div className="w-1/3 h-5 bg-white/5 rounded" />
          <div className="w-full h-10 bg-white/5 rounded" />
          <div className="w-2/3 h-20 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/roles/${roleId}`}
            className="p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-muted-foreground hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h1 className="text-xl font-bold tracking-tight text-white">
                Edit Role: <span className="text-indigo-400">{name || roleId}</span>
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sesuaikan wewenang, deskripsi peran, dan hak akses kontrol gRPC
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/roles/${roleId}`}
            className="px-3.5 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-white/80 hover:bg-white/5 transition-colors"
          >
            Batal
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : success ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tersimpan!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-rose-300">Gagal Memperbarui Role</h4>
            <p className="text-xs text-rose-200/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
          <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-emerald-300">Berhasil Disimpan</h4>
            <p className="text-xs text-emerald-200/80 mt-0.5">Role telah diperbarui. Mengalihkan ke halaman detail...</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role Information */}
        <div className="card-elevated p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white/90 flex items-center gap-2 border-b border-white/5 pb-3">
            <Layers className="w-4 h-4 text-indigo-400" />
            Informasi Dasar Role
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70">
                Nama Role <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Content Operator"
                className="w-full px-3.5 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70">
                Identifier ID
              </label>
              <input
                type="text"
                value={roleId}
                disabled
                className="w-full px-3.5 py-2 rounded-lg bg-white/5 border border-white/5 text-xs text-white/50 font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/70">
              Deskripsi Peran
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsikan ruang lingkup tanggung jawab dari role ini..."
              rows={3}
              className="w-full px-3.5 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Permissions Assignment */}
        <div className="card-elevated p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Matriks Hak Akses (Permissions)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pilih izin tindakan yang diizinkan untuk role ini pada gRPC API backend.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-white/80 transition-colors"
              >
                Pilih Semua
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-white/80 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {Object.keys(groupedPermissions).length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Belum ada permissions yang terdaftar di database.
            </p>
          ) : (
            <div className="space-y-5 pt-2">
              {Object.entries(groupedPermissions).map(([group, perms]) => (
                <div key={group} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-indigo-400/90 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {group}
                    </span>
                    <span className="text-[11px] text-white/40">
                      ({perms.filter(p => selectedPermIds.includes(p.id)).length}/{perms.length} aktif)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {perms.map(perm => {
                      const isChecked = selectedPermIds.includes(perm.id);
                      return (
                        <div
                          key={perm.id}
                          onClick={() => togglePermission(perm.id)}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                            isChecked
                              ? "bg-indigo-500/10 border-indigo-500/30 text-white"
                              : "bg-white/[0.02] border-white/5 hover:border-white/10 text-white/70"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors ${
                            isChecked 
                              ? "bg-indigo-500 border-indigo-400 text-white" 
                              : "border-white/20 bg-black/20"
                          }`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>

                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="text-xs font-semibold font-mono truncate">
                              {perm.code}
                            </div>
                            <div className="text-[11px] text-muted-foreground line-clamp-1">
                              {perm.name || perm.description || "Izin akses gRPC endpoint"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-muted-foreground">
            Total izin terpilih: <span className="font-semibold text-white">{selectedPermIds.length}</span> dari {availablePermissions.length}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/roles/${roleId}`}
              className="px-4 py-2 rounded-lg border border-white/10 text-xs font-medium text-white/80 hover:bg-white/5 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : success ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
