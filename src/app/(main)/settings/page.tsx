import { Settings, User, Bell, ShieldCheck, CreditCard, Palette } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-4xl font-black text-white flex items-center gap-3 mb-10">
        <Settings className="text-primary-chess" size={36} />
        Settings
      </h1>

      <div className="space-y-4">
        <SettingsSection icon={<User size={20} />} title="Profile" description="Update your username, avatar and bio" />
        <SettingsSection icon={<Bell size={20} />} title="Notifications" description="Manage game alerts, email and push notifications" />
        <SettingsSection icon={<CreditCard size={20} />} title="Billing & Wallet" description="Payment methods, transaction history and withdrawals" />
        <SettingsSection icon={<ShieldCheck size={20} />} title="Security" description="Password, two-factor authentication and active sessions" />
        <SettingsSection icon={<Palette size={20} />} title="Appearance" description="Theme, board style, piece set and language" />
      </div>
    </div>
  );
}

function SettingsSection({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-bg-panel border border-gray-800 hover:border-gray-600 rounded-xl p-5 flex items-center justify-between cursor-pointer transition-colors group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-bg-sidebar flex items-center justify-center text-primary-chess group-hover:bg-primary-chess/20 transition-colors">
          {icon}
        </div>
        <div>
          <p className="font-bold text-white">{title}</p>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
      <div className="text-gray-600 group-hover:text-gray-300 transition-colors">›</div>
    </div>
  );
}
