"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { api } from "@/lib/api"
import ConfirmDialog from "@/components/admin/confirm-dialog"
import {
  Users, Plus, Search, Pencil, Trash2,
  ChevronLeft, ChevronRight, UserCircle2,
  Weight, Ruler, Activity,
} from "lucide-react"

const ACTIVITY_META = {
  sedentary:   { label: "Sedentario", color: "#64748B" },
  light:       { label: "Ligero",     color: "#3B82F6" },
  moderate:    { label: "Moderado",   color: "#16A34A" },
  active:      { label: "Activo",     color: "#F97316" },
  very_active: { label: "Muy activo", color: "#DC2626" },
}

// ── Estilos compartidos ──────────────────────────────────────────────────────
const S = {
  surface:  { background: "var(--color-surface)",       borderColor: "var(--color-border)" },
  raised:   { background: "var(--color-surface-raised)", borderColor: "var(--color-border)" },
  textMain: { color: "var(--color-foreground)" },
  textMuted:{ color: "var(--color-foreground-muted)" },
  textSub:  { color: "var(--color-foreground-subtle)" },
  border:   { borderColor: "var(--color-border)" },
}

const iconBtn = (hoverColor) => ({
  base:  { color: "var(--color-foreground-subtle)", background: "transparent" },
  hover: { background: hoverColor + "18",           color: hoverColor },
})

export default function AdminUsers() {
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState("")
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal]           = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser]   = useState(null)
  const [confirmOpen, setConfirmOpen]   = useState(false)
  const [deletingId, setDeletingId]     = useState(null)
  const [deleting, setDeleting]         = useState(false)
  const [formData, setFormData] = useState({
    name: "", email: "", password: "",
    weight_kg: "", height_cm: "", age: "", sex: "", activity_factor: "",
  })

  useEffect(() => { fetchUsers() }, [page, search])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const query    = search ? `?search=${search}&page=${page}` : `?page=${page}`
      const response = await api.get(`/v1/admin/users${query}`)
      setUsers(response.data.data || response.data)
      setTotalPages(response.data.last_page || 1)
      setTotal(response.data.total || 0)
    } catch (e) { console.error(e) }
    finally     { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { ...formData }
      if (!data.password) delete data.password
      if (editingUser) { await api.put(`/v1/admin/users/${editingUser.id}`, data) }
      else             { await api.post("/v1/admin/users", data) }
      setIsDialogOpen(false)
      resetForm()
      fetchUsers()
    } catch (e) { alert(e.message || "Error al guardar usuario") }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name || "", email: user.email || "", password: "",
      weight_kg: user.weight_kg || "", height_cm: user.height_cm || "",
      age: user.age || "", sex: user.sex || "", activity_factor: user.activity_factor || "",
    })
    setIsDialogOpen(true)
  }

  const askDelete = (id) => {
    setDeletingId(id)
    setConfirmOpen(true)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/v1/admin/users/${deletingId}`)
      setConfirmOpen(false)
      fetchUsers()
    } catch (e) {
      alert(e.message || "Error al eliminar")
    } finally {
      setDeleting(false)
      setDeletingId(null)
    }
  }

  const resetForm = () => {
    setEditingUser(null)
    setFormData({ name: "", email: "", password: "", weight_kg: "", height_cm: "", age: "", sex: "", activity_factor: "" })
  }

  const getInitials = (name) => name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold" style={S.textMain}>Usuarios</h1>
          <p className="text-sm mt-0.5" style={S.textMuted}>
            {total > 0 ? `${total} usuarios registrados` : "Gestiona perfiles y datos nutricionales"}
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsDialogOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer text-white transition-colors duration-150"
          style={{ background: "var(--color-primary)" }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--color-primary-hover)"}
          onMouseLeave={e => e.currentTarget.style.background = "var(--color-primary)"}
        >
          <Plus className="h-4 w-4" /> Nuevo usuario
        </button>
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={S.textSub} />
        <input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full h-10 pl-9 pr-3 rounded-lg border text-sm outline-none"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}
        />
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border overflow-hidden" style={{ ...S.surface, boxShadow: "var(--shadow-sm)" }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={S.textMuted}>
            <UserCircle2 className="h-12 w-12 mb-3" style={S.textSub} />
            <p className="text-sm font-medium">No hay usuarios aún</p>
            <button className="text-sm mt-1 cursor-pointer" style={{ color: "var(--color-primary)" }}
              onClick={() => { resetForm(); setIsDialogOpen(true) }}>
              Crear el primero
            </button>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b" style={S.raised}>
              {[["col-span-4","Usuario"],["col-span-4","Datos físicos"],["col-span-2","Actividad"],["col-span-2 text-right","Acciones"]].map(([cls, label]) => (
                <p key={label} className={`${cls} text-xs font-semibold uppercase tracking-wide`} style={S.textMuted}>{label}</p>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y" style={S.border}>
              {users.map((user) => {
                const act = ACTIVITY_META[user.activity_factor]
                return (
                  <div
                    key={user.id}
                    className="grid grid-cols-12 gap-4 px-5 py-4 items-center transition-colors duration-150"
                    onMouseEnter={e => e.currentTarget.style.background = "var(--color-surface-raised)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Avatar + nombre */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "var(--color-primary-light)" }}>
                        <span className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>
                          {getInitials(user.name)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={S.textMain}>{user.name}</p>
                        <p className="text-xs truncate" style={S.textMuted}>{user.email}</p>
                      </div>
                    </div>

                    {/* Datos físicos */}
                    <div className="col-span-4 flex flex-wrap gap-1.5">
                      {[
                        user.weight_kg && { Icon: Weight, label: `${user.weight_kg} kg` },
                        user.height_cm && { Icon: Ruler,  label: `${user.height_cm} cm` },
                        user.age       && { Icon: null,   label: `${user.age} años` },
                      ].filter(Boolean).map(({ Icon, label }) => (
                        <span key={label} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: "var(--color-surface-raised)", color: "var(--color-foreground-muted)" }}>
                          {Icon && <Icon className="h-3 w-3" />}{label}
                        </span>
                      ))}
                    </div>

                    {/* Actividad */}
                    <div className="col-span-2">
                      {act ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: act.color + "18", color: act.color }}>
                          <Activity className="h-3 w-3" />{act.label}
                        </span>
                      ) : <span className="text-xs" style={S.textSub}>—</span>}
                    </div>

                    {/* Acciones */}
                    <div className="col-span-2 flex justify-end gap-1">
                      {[
                        { Icon: Pencil, color: "#64748B", onClick: () => handleEdit(user) },
                        { Icon: Trash2, color: "#DC2626", onClick: () => askDelete(user.id) },
                      ].map(({ Icon, color, onClick }, i) => (
                        <button key={i} onClick={onClick}
                          className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-150"
                          style={{ color: "var(--color-foreground-subtle)", background: "transparent" }}
                          onMouseEnter={e => { e.currentTarget.style.background = color + "18"; e.currentTarget.style.color = color }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-foreground-subtle)" }}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t" style={S.raised}>
                <p className="text-xs" style={S.textSub}>Página {page} de {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="cursor-pointer h-8">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="cursor-pointer h-8">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Dialog ── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-3">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "name",     label: "Nombre completo", type: "text",     span: 2, required: true },
                  { key: "email",    label: "Email",           type: "email",    span: 2, required: true },
                  { key: "password", label: editingUser ? "Contraseña (vacío = sin cambio)" : "Contraseña", type: "password", span: 2, required: !editingUser },
                ].map(({ key, label, type, span, required }) => (
                  <div key={key} className={`col-span-${span} space-y-1.5`}>
                    <Label className="text-xs font-medium" style={S.textMuted}>{label}</Label>
                    <Input type={type} value={formData[key]} required={required}
                      onChange={e => setFormData({ ...formData, [key]: e.target.value })} />
                  </div>
                ))}
              </div>

              <div className="border-t pt-4" style={S.border}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={S.textMuted}>Datos físicos</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "weight_kg", label: "Peso (kg)" },
                    { key: "height_cm", label: "Altura (cm)" },
                    { key: "age",       label: "Edad" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-1.5">
                      <Label className="text-xs" style={S.textMuted}>{label}</Label>
                      <Input type="number" value={formData[key]}
                        onChange={e => setFormData({ ...formData, [key]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs" style={S.textMuted}>Sexo</Label>
                  <Select value={formData.sex} onValueChange={v => setFormData({ ...formData, sex: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs" style={S.textMuted}>Nivel de actividad</Label>
                  <Select value={formData.activity_factor} onValueChange={v => setFormData({ ...formData, activity_factor: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ACTIVITY_META).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="cursor-pointer">
                Cancelar
              </Button>
              <button type="submit"
                className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer text-white transition-colors duration-150"
                style={{ background: "var(--color-primary)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--color-primary-hover)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--color-primary)"}
              >
                {editingUser ? "Actualizar" : "Crear usuario"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

          <ConfirmDialog
        open={confirmOpen}
        title="¿Eliminar usuario?"
        description="Se eliminará permanentemente el perfil y todos sus datos. Esta acción no se puede deshacer."
        confirmLabel="Eliminar usuario"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => { setConfirmOpen(false); setDeletingId(null) }}
      />
    </div>
  )
}
