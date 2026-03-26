export default function SettingsPage({ audioEnabled, toggleAudio }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Settings</h2>
        <p className="text-on-surface-variant mt-1">Manage salon preferences</p>
      </div>

      <div className="bg-surface-container-lowest rounded-[2rem] p-8 ambient-shadow max-w-xl">
        <h3 className="font-extrabold text-on-surface mb-6">Notification Preferences</h3>
        <div className="flex items-center justify-between py-4 border-b border-surface-container">
          <div>
            <p className="font-semibold text-on-surface text-sm">Sound Notifications</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Play a sound when a new appointment arrives</p>
          </div>
          <button
            onClick={toggleAudio}
            className={`w-12 h-6 rounded-full transition-all relative ${audioEnabled ? 'bg-primary' : 'bg-surface-container-highest'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${audioEnabled ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
