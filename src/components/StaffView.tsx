import React, { useState } from 'react';
import { 
  UserCheck, 
  Plus, 
  Mail, 
  Phone, 
  Shield, 
  Sparkles, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Trash2, 
  Edit3, 
  X 
} from 'lucide-react';
import { StaffMember, StaffRole, Room, UserSettings } from '../types';
import { getAccentClasses, playChime } from '../utils/helpers';

interface StaffViewProps {
  staff: StaffMember[];
  rooms: Room[];
  settings: UserSettings;
  onUpdateStaff: (staffList: StaffMember[]) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  staff,
  rooms,
  settings,
  onUpdateStaff,
}) => {
  const accent = getAccentClasses(settings.accentColor);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('Housekeeping');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [shift, setShift] = useState<'Morning' | 'Evening' | 'Night'>('Morning');
  const [status, setStatus] = useState<'on_duty' | 'off_duty' | 'break'>('on_duty');

  const openAddModal = () => {
    setName('');
    setRole('Housekeeping');
    setEmail('');
    setPhone('');
    setShift('Morning');
    setStatus('on_duty');
    setEditingStaff(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (member: StaffMember) => {
    setEditingStaff(member);
    setName(member.name);
    setRole(member.role);
    setEmail(member.email);
    setPhone(member.phone);
    setShift(member.shift);
    setStatus(member.status);
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (settings.soundEffects) playChime();

    if (editingStaff) {
      const updated = staff.map((s) =>
        s.id === editingStaff.id
          ? {
              ...s,
              name,
              role,
              email,
              phone,
              shift,
              status,
            }
          : s
      );
      onUpdateStaff(updated);
    } else {
      const newMember: StaffMember = {
        id: `staff-${Date.now()}`,
        name,
        role: role as any,
        email,
        phone,
        shift,
        status: status === 'on_duty' ? 'active' : status === 'break' ? 'on_break' : 'offline',
        joinedDate: new Date().toISOString().split('T')[0],
        avatarColor: 'from-amber-500 to-amber-700',
        accessLevel: 'Standard',
      };
      onUpdateStaff([...staff, newMember]);
    }
    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      if (settings.soundEffects) playChime();
      onUpdateStaff(staff.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* Header & Add button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900/80 border border-neutral-800 p-4 rounded-2xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-amber-400" />
            <span>Staff Roster & Housekeeping Operations</span>
          </h3>
          <p className="text-xs text-neutral-400">
            Active team schedules, housekeeping assignments, and shift rosters
          </p>
        </div>

        <button
          onClick={openAddModal}
          className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md ${accent.primary}`}
        >
          <Plus className="h-4 w-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((member) => {
          const assignedCount = rooms.filter((r) => r.assignedHousekeeper === member.name).length;

          return (
            <div
              key={member.id}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-4 shadow-xl flex flex-col justify-between hover:border-neutral-700 transition-all"
            >
              <div>
                {/* Top Info */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-950 border border-neutral-800 text-base font-bold text-amber-300 font-mono">
                      {member.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{member.name}</h4>
                      <span className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                        <Shield className="h-3 w-3 text-neutral-500" />
                        {member.role}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      member.status === 'on_duty'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : member.status === 'break'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        member.status === 'on_duty'
                          ? 'bg-emerald-400'
                          : member.status === 'break'
                          ? 'bg-amber-400'
                          : 'bg-neutral-500'
                      }`}
                    ></span>
                    {member.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Contact & Shift Info */}
                <div className="rounded-xl bg-neutral-950/80 border border-neutral-800/80 p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="text-neutral-500 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Shift
                    </span>
                    <span className="font-semibold">{member.shift} Shift</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="text-neutral-500 flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> Email
                    </span>
                    <span className="truncate max-w-[160px]">{member.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="text-neutral-500 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> Phone
                    </span>
                    <span className="font-mono">{member.phone}</span>
                  </div>
                  {member.role === 'Housekeeping' && (
                    <div className="flex items-center justify-between text-neutral-300 pt-1 border-t border-neutral-800">
                      <span className="text-neutral-500">Assigned Suites</span>
                      <span className="font-bold text-amber-300">{assignedCount} Suites</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-end gap-2 mt-3">
                <button
                  onClick={() => openEditModal(member)}
                  className="flex items-center gap-1 rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200 hover:text-white hover:bg-neutral-700 transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  className="p-1.5 rounded-xl text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                  title="Delete Staff"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Staff Modal */}
      {isAddModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div 
            className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingStaff ? 'Edit Staff Profile' : 'Add New Staff Member'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as StaffRole)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Front Desk">Front Desk</option>
                    <option value="Manager">Manager</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Accountant">Accountant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Shift Schedule</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Morning">Morning (06:00 - 14:00)</option>
                    <option value="Evening">Evening (14:00 - 22:00)</option>
                    <option value="Night">Night (22:00 - 06:00)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Email</label>
                  <input
                    type="email"
                    placeholder="maria@palace.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-semibold">Current Duty Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="on_duty">On Duty (Active)</option>
                  <option value="break">On Break</option>
                  <option value="off_duty">Off Duty</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-neutral-800 px-4 py-2 text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-5 py-2 font-bold transition-all shadow-md ${accent.primary}`}
                >
                  {editingStaff ? 'Update Profile' : 'Save Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
