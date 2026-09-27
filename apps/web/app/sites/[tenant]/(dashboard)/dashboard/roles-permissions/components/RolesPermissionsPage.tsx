"use client";
import React, { useState } from 'react';
import { initialRoles, PERMISSION_MODULES, RoleRecord } from '../data/rolesPermissionsData';


const RolesPermissionsPage = () => {
  const [roles, setRoles] = useState<RoleRecord[]>(initialRoles);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(initialRoles[0]?.id || '');
  
  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  // Get currently selected role object
  const activeRole = roles.find(r => r.id === selectedRoleId);

  // --- FUNCTIONAL HANDLERS ---
  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    
    const newRole: RoleRecord = {
      id: `r_custom_${Date.now()}`,
      name: newRoleName,
      type: 'Custom',
      assignedUsers: 0,
      permissions: [] 
    };
    
    setRoles([...roles, newRole]);
    setSelectedRoleId(newRole.id); 
    setNewRoleName('');
    setIsCreateOpen(false);
  };

  const handleTogglePermission = (permissionKey: string) => {
    if (!activeRole) return;
    
    if (activeRole.name === 'Super Admin / Principal') {
      alert("System Super Admin permissions cannot be modified.");
      return;
    }

    setRoles(prevRoles => prevRoles.map(role => {
      if (role.id === activeRole.id) {
        const hasPerm = role.permissions.includes(permissionKey);
        const updatedPerms = hasPerm 
          ? role.permissions.filter(p => p !== permissionKey) 
          : [...role.permissions, permissionKey];
        return { ...role, permissions: updatedPerms };
      }
      return role;
    }));
  };

  const handleSavePermissions = () => {
    alert(`Permissions successfully updated for ${activeRole?.name}!`);
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-1">Roles & Permissions</h1>
          <p className="text-sm text-gray-500">Configure access levels and security permissions for your school staff</p>
        </div>
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-[#1C263A] hover:bg-[#111827] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer ml-auto md:ml-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Create Custom Role
        </button>
      </div>

      {/* Main Grid Layout - Fixed Alignment Issue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)] min-h-125">
        
        {/* Left Column: Roles List (Master) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          {/* Identical Header Structure for perfect alignment */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/80 shrink-0">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Available Roles</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
            {roles.map(role => (
              <div 
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedRoleId === role.id 
                    ? 'bg-[#1C263A] border-[#1C263A] shadow-md' 
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <h4 className={`font-bold text-sm ${selectedRoleId === role.id ? 'text-white' : 'text-gray-900'}`}>
                    {role.name}
                  </h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    role.type === 'System' 
                      ? (selectedRoleId === role.id ? 'bg-white/20 text-white border-white/30' : 'bg-gray-100 text-gray-600 border-gray-200')
                      : (selectedRoleId === role.id ? 'bg-blue-500/20 text-blue-100 border-blue-400/30' : 'bg-blue-50 text-blue-700 border-blue-200')
                  }`}>
                    {role.type}
                  </span>
                </div>
                <p className={`text-xs font-medium ${selectedRoleId === role.id ? 'text-gray-300' : 'text-gray-500'}`}>
                  {role.assignedUsers} {role.assignedUsers === 1 ? 'user' : 'users'} assigned
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Permission Matrix (Detail) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 flex flex-col shadow-sm overflow-hidden">
          {activeRole ? (
            <>
              {/* Identical Header Structure */}
              <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 shrink-0">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{activeRole.name} Permissions</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Select the capabilities this role should have across the ERP.</p>
                </div>
                <button 
                  onClick={handleSavePermissions}
                  className="bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {PERMISSION_MODULES.map((module) => (
                  <div key={module.moduleName} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100">
                      <h4 className="text-sm font-bold text-gray-800">{module.moduleName}</h4>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {module.permissions.map(perm => {
                        const isChecked = activeRole.permissions.includes(perm.key);
                        const isDisabled = activeRole.name === 'Super Admin / Principal';
                        
                        return (
                          <label key={perm.key} className={`flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-gray-900">{perm.label}</span>
                              <span className="text-[10px] font-mono text-gray-400 mt-0.5">{perm.key}</span>
                            </div>
                            
                            {/* Updated Standard Toggle Switch (Perfectly Aligned) */}
                            <div className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isChecked ? 'bg-[#1C263A]' : 'bg-gray-200'}`}>
                              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isChecked ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>

                            <input 
                              type="checkbox" 
                              className="hidden" 
                              checked={isChecked}
                              disabled={isDisabled}
                              onChange={() => handleTogglePermission(perm.key)}
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a role to view or edit permissions
            </div>
          )}
        </div>
      </div>

      {/* Create Custom Role Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateRole} className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Create Custom Role</h3>
            <p className="text-xs text-gray-500">Create a specific role, then assign permissions from the dashboard.</p>
            
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Role Title</label>
              <input 
                required 
                autoFocus
                value={newRoleName} 
                onChange={e => setNewRoleName(e.target.value)} 
                type="text" 
                placeholder="e.g., Librarian, Transport Head" 
                className="w-full border border-gray-200 p-2.5 rounded-lg text-sm outline-none focus:border-[#1C263A]" 
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm font-semibold border rounded-lg cursor-pointer hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold bg-[#1C263A] text-white rounded-lg cursor-pointer hover:bg-gray-800">Create Role</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RolesPermissionsPage;