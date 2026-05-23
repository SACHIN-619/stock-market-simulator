import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../service/api";
import Skeleton from "./Skeleton";
import CoinIcon from "./CoinIcon";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showSettings, setShowSettings] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [imageError, setImageError] = useState(false); // Fix for avatar fallback logic
  const [formData, setFormData] = useState({ 
    username: "", 
    email: "", 
    password: "", 
    currentPassword: "", 
    profileImage: "" 
  });

  // Centralized function to sync form state with official user state
  const resetFormToUser = (userData) => {
    if (!userData) return;
    setFormData({
      username: userData.username || "",
      email: userData.email || "",
      password: "",
      currentPassword: "",
      profileImage: userData.profileImage || ""
    });
    setImageError(false);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/profile");
        setUser(res.data.payload);
        resetFormToUser(res.data.payload);
      } catch (err) {
        console.error("Profile Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleCloseModal = () => {
    setShowSettings(false);
    setIsEditing(false);
    resetFormToUser(user); // Fixed: Reset form states back to current database values
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put("/auth/update-profile", formData);
      setUser(res.data.payload);
      resetFormToUser(res.data.payload);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("image", file);

    try {
      setLoading(true);
      const res = await api.post("/auth/upload-image", uploadData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setUser(res.data.payload);
      setFormData(prev => ({ ...prev, profileImage: res.data.payload.profileImage }));
      setImageError(false);
      alert("Profile image updated!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!window.confirm("Remove profile image?")) return;
    try {
      setLoading(true);
      const res = await api.delete("/auth/remove-image");
      setUser(res.data.payload);
      setFormData(prev => ({ ...prev, profileImage: "" }));
      setImageError(false);
      alert("Profile image removed");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to remove image");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10">
        <Skeleton className="h-64 w-full bg-white border border-slate-100 rounded-[2.5rem] shadow-xs" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <header className="text-left">
        <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Your Account</h1>
        <p className="text-slate-500 mt-2 text-sm font-medium">Manage your personal settings, upload custom credentials, and view wallet summary.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* PERSONAL INFO */}
          <section className="glass-card bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 relative group">
            {/* HIDDEN FILE INPUT */}
            <input 
              type="file" 
              id="profileUpload" 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
            />

            {/* PROFILE EDIT BUTTONS */}
            <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition duration-300">
              {user?.profileImage && (
                <button 
                  onClick={handleRemoveImage}
                  className="p-2.5 rounded-xl bg-rose-50 border border-rose-100/50 text-rose-600 hover:bg-rose-600 hover:text-white transition duration-300 cursor-pointer"
                  title="Remove image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
              )}
              <button 
                onClick={() => document.getElementById('profileUpload').click()}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-500/50 transition duration-300 cursor-pointer"
                title="Import from files"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div 
                onClick={() => document.getElementById('profileUpload').click()}
                className="w-24 h-24 rounded-3xl bg-indigo-50 border-2 border-indigo-100/50 overflow-hidden flex items-center justify-center text-4xl shadow-md shadow-indigo-100/10 relative cursor-pointer group/avatar flex-shrink-0"
              >
                {user?.profileImage && !imageError ? (
                  <img 
                    src={user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:5000/${user.profileImage.replace(/^\/+/, '')}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)} // Fixed DOM manipulation bug
                  />
                ) : (
                  <span className="text-indigo-500">👤</span>
                )}
                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">{user?.username}</h2>
                <p className="text-slate-500 text-sm font-medium">{user?.email}</p>
                <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100/40 rounded-lg text-[9px] font-black uppercase tracking-widest text-indigo-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  {user?.role} Account
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-slate-100">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Account ID Number</p>
                <p className="font-black text-slate-800 text-sm tracking-wide uppercase">
                  #{user?.role?.charAt(0).toUpperCase()}-{user?._id?.substring(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Membership Start</p>
                <p className="font-black text-slate-800 text-sm">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "March 2024"}
                </p>
              </div>
            </div>
          </section>

          {/* SECURITY / SETTINGS */}
          <section className="glass-card bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-wide">Privacy & Security Settings</h3>
            <div className="space-y-4">
              <button 
                onClick={() => setShowSettings(true)}
                className="flex items-center justify-between w-full p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-500/50 transition duration-300 group cursor-pointer"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl group-hover:scale-105 transition shadow-xs">
                    ⚙️
                  </div>
                  <div>
                    <p className="font-black text-slate-800">Account Credentials</p>
                    <p className="text-xs text-slate-500 font-medium tracking-tight mt-0.5">Update password, change username, or edit primary email.</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-indigo-600 transition-colors"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          </section>
        </div>

        {/* WALLET SUMMARY */}
        <aside>
          <div className="glass-card p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/5 via-white to-white border border-indigo-100 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">StockKing Virtual Wallet</h3>
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Available Credits</p>
                <h4 className="text-3xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
                  <CoinIcon className="w-8 h-8" />
                  {user?.walletBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h4>
              </div>
              
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <Link
                  to="/stocks"
                  className="block w-full py-4 rounded-2xl text-center font-black text-xs uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  START TRADING
                </Link>
              </div>
              
              <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                All simulator credits are virtual and for performance testing only
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="glass-card w-full max-w-md rounded-[2.5rem] bg-white border border-slate-100 p-8 shadow-xl relative animate-scale-up">
            
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">Account Settings</h2>
              
              <div className="flex items-center gap-2">
                {/* EDIT BUTTON */}
                <button 
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${isEditing ? 'text-indigo-600 bg-indigo-50 border border-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
                  title="Edit Details"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                </button>

                {/* CLOSE BUTTON */}
                <button 
                  type="button"
                  onClick={handleCloseModal} // Fixed modal closure reset handle
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-4">
                {/* USERNAME */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Username</label>
                  <input 
                    type="text" 
                    disabled={!isEditing}
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* EMAIL */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                  <input 
                    type="email" 
                    disabled={!isEditing}
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* CURRENT PASSWORD (ONLY IN EDIT MODE) */}
                {isEditing && (
                  <div className="space-y-1.5 animate-slide-down">
                    <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest px-1">Current Password</label>
                    <input 
                      type="password" 
                      required={formData.password.length > 0 || formData.username !== user?.username || formData.email !== user?.email}
                      placeholder="Required to save critical changes"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                      className="w-full bg-indigo-50/20 border border-indigo-200 rounded-xl px-4 py-3 text-sm font-bold text-indigo-700 focus:bg-white focus:border-indigo-500 outline-none transition shadow-sm"
                    />
                  </div>
                )}

                {/* NEW PASSWORD (ONLY IN EDIT MODE) */}
                {isEditing && (
                  <div className="space-y-1.5 animate-slide-down">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">New Password</label>
                    <input 
                      type="password" 
                      placeholder="Enter new password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                )}
              </div>

              {isEditing && (
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs tracking-widest uppercase py-4 rounded-2xl shadow-md transition-all active:scale-95 mt-4 cursor-pointer"
                >
                  SAVE CHANGES
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;