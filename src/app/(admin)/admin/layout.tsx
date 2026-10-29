"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { UserRole } from "@/types/user";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>("admin");

  return (
    <div className="flex h-screen bg-[#F5F3F2] overflow-hidden">
      {/* Sidebar fijo */}
      <AdminSidebar currentRole={currentRole} onRoleChange={setCurrentRole} />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader currentRole={currentRole} />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
