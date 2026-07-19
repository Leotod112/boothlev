"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2, Plus, ArrowLeft, RefreshCw, Eye, Lock, ExternalLink, ShieldAlert } from "lucide-react";

// SVG Icon Manual untuk Github
const GithubIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
    <path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
);
import { Button } from "@/components/ui/Button";

export default function GitHubManagerPage() {
  const [token, setToken] = useState("");
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Create Repo States
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoDesc, setNewRepoDesc] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Cek apakah ada token yang tersimpan di localStorage
    const savedToken = localStorage.getItem("syzhaa-github-token");
    if (savedToken) {
      setToken(savedToken);
      fetchGitHubData(savedToken);
    }
  }, []);

  const fetchGitHubData = async (accessToken) => {
    setIsLoading(true);
    setError("");
    try {
      // Fetch User Info
      const userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `token ${accessToken}` }
      });
      if (!userRes.ok) throw new Error("Token tidak valid atau kadaluarsa.");
      const userData = await userRes.json();
      
      // Fetch Repositories
      const reposRes = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
        headers: { Authorization: `token ${accessToken}` }
      });
      if (!reposRes.ok) throw new Error("Gagal mengambil repository.");
      const reposData = await reposRes.json();

      setUser(userData);
      // Filter hanya repo di mana user adalah owner (bukan organisasi/kolaborator)
      setRepos(reposData.filter(r => r.owner.login === userData.login));
      setIsLogged(true);
      localStorage.setItem("syzhaa-github-token", accessToken);
    } catch (err) {
      setError(err.message);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!token.trim()) return;
    fetchGitHubData(token.trim());
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    setRepos([]);
    setIsLogged(false);
    localStorage.removeItem("syzhaa-github-token");
  };

  const handleCreateRepo = async (e) => {
    e.preventDefault();
    if (!newRepoName.trim()) return alert("Nama repo tidak boleh kosong.");
    
    setIsCreating(true);
    try {
      const res = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json"
        },
        body: JSON.stringify({
          name: newRepoName.trim(),
          description: newRepoDesc.trim(),
          private: isPrivate,
          auto_init: true // Buat README.md otomatis
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Gagal membuat repo.");
      }

      alert(`Repository ${newRepoName} berhasil dibuat!`);
      setNewRepoName("");
      setNewRepoDesc("");
      setIsPrivate(false);
      fetchGitHubData(token); // Refresh list
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRepo = async (repoName) => {
    // Proteksi anti-hapus repo ini sendiri (cam-frontend/boothlev)
    if (repoName.toLowerCase() === "boothlev") {
      return alert("PERINGATAN: Dilarang menghapus repository utama ini (boothlev) dari panel!");
    }

    const confirmName = prompt(`⚠️ PERINGATAN! Ini akan MENGHAPUS PERMANEN repository "${repoName}".\n\nKetik nama repository ("${repoName}") untuk konfirmasi penghapusan:`);
    if (confirmName !== repoName) {
      if (confirmName !== null) alert("Nama tidak cocok. Penghapusan dibatalkan.");
      return;
    }

    try {
      const res = await fetch(`https://api.github.com/repos/${user.login}/${repoName}`, {
        method: "DELETE",
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json"
        }
      });

      if (!res.ok && res.status !== 204) {
        throw new Error("Token tidak memiliki izin 'delete_repo' atau gagal terhapus.");
      }

      alert(`Repository ${repoName} berhasil dihapus.`);
      setRepos(repos.filter(r => r.name !== repoName));
    } catch (err) {
      alert("Error: " + err.message + "\n\nPastikan Token GitHub kamu (PAT) memiliki scope/permission 'delete_repo' yang dicentang saat membuatnya.");
    }
  };

  if (!isLogged) {
    return (
      <div className="min-h-[100dvh] bg-gray-100 flex flex-col items-center justify-center p-6">
        <div className="bg-white brutal-border brutal-shadow p-8 max-w-md w-full">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white brutal-border">
              <GithubIcon className="w-8 h-8" />
            </div>
          </div>
          <h1 className="font-archivo text-3xl uppercase text-center mb-2">GitHub Manager</h1>
          <p className="text-gray-600 text-sm text-center font-medium mb-8">
            Kelola repositori GitHub dengan mudah. Buat dan hapus repo langsung dari sini.
          </p>

          {error && (
            <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 mb-6 rounded text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase block mb-1">Personal Access Token (Classic)</label>
              <input 
                type="password" 
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full border-2 border-black p-3 font-mono text-sm"
                required
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Token harus memiliki scope: <strong>repo</strong> dan <strong>delete_repo</strong>.
              </p>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full bg-black text-white hover:bg-gray-800">
              {isLoading ? "MENYAMBUNGKAN..." : "LOGIN"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link href="/" className="text-xs font-bold text-gray-500 hover:underline">← KEMBALI KE BERANDA</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-100">
      {/* Navbar Admin */}
      <div className="bg-black text-white p-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-primary transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="font-archivo text-xl uppercase tracking-tighter flex items-center gap-2">
            <GithubIcon className="w-5 h-5" /> MANAGER
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <img src={user.avatar_url} alt={user.login} className="w-8 h-8 rounded-full border-2 border-white" />
            <span className="font-bold text-sm">{user.login}</span>
          </div>
          <button onClick={handleLogout} className="bg-white text-black px-3 py-1 text-xs font-bold rounded hover:bg-red-500 hover:text-white transition-colors">
            LOGOUT
          </button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto p-6 md:p-12 flex flex-col lg:flex-row gap-8">
        
        {/* Kolom Kiri: Create Repo */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white brutal-border brutal-shadow p-6 sticky top-24">
            <h2 className="font-archivo text-2xl uppercase mb-6 flex items-center gap-2 border-b-4 border-black pb-2">
              <Plus className="w-6 h-6" /> BUAT REPO
            </h2>
            <form onSubmit={handleCreateRepo} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase block mb-1">Nama Repository</label>
                <input 
                  type="text" 
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value.replace(/[^a-zA-Z0-9_.-]/g, '-'))}
                  placeholder="nama-project-baru"
                  className="w-full border-2 border-black p-2 font-mono text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase block mb-1">Deskripsi (Opsional)</label>
                <textarea 
                  value={newRepoDesc}
                  onChange={(e) => setNewRepoDesc(e.target.value)}
                  placeholder="Project ini tentang..."
                  className="w-full border-2 border-black p-2 text-sm h-20"
                />
              </div>
              <div className="flex items-center gap-2 bg-gray-100 p-3 brutal-border">
                <input 
                  type="checkbox" 
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 accent-black"
                />
                <label htmlFor="isPrivate" className="text-xs font-bold uppercase flex items-center gap-1 cursor-pointer">
                  <Lock className="w-3 h-3" /> Private Repo
                </label>
              </div>
              <Button type="submit" disabled={isCreating} variant="primary" className="w-full">
                {isCreating ? "MEMBUAT..." : "BUAT REPOSITORY"}
              </Button>
            </form>
          </div>
        </div>

        {/* Kolom Kanan: Daftar Repo */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-archivo text-3xl uppercase tracking-tighter flex items-center gap-2">
              Daftar Repository
            </h2>
            <Button onClick={() => fetchGitHubData(token)} variant="outline" className="h-10 px-4 text-xs gap-2">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> REFRESH
            </Button>
          </div>

          <div className="bg-white brutal-border brutal-shadow p-6">
            <div className="mb-4 text-xs font-bold text-gray-500 uppercase">
              TOTAL: {repos.length} REPOSITORY
            </div>

            {isLoading && repos.length === 0 ? (
              <div className="text-center py-12 text-gray-500 font-bold uppercase animate-pulse">Memuat data GitHub...</div>
            ) : (
              <div className="space-y-3">
                {repos.map((repo) => (
                  <div key={repo.id} className="border-2 border-black p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <a href={repo.html_url} target="_blank" rel="noreferrer" className="font-bold text-lg text-blue-700 hover:underline truncate">
                          {repo.name}
                        </a>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-black ${repo.private ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {repo.private ? 'Private' : 'Public'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{repo.description || "Tidak ada deskripsi"}</p>
                      <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-gray-400">
                        <span>⭐ {repo.stargazers_count}</span>
                        <span>🔄 Update: {new Date(repo.updated_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <a href={repo.html_url} target="_blank" rel="noreferrer" className="p-2 border-2 border-black hover:bg-gray-200 rounded" title="Buka di GitHub">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={() => handleDeleteRepo(repo.name)}
                        className="p-2 border-2 border-black bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded transition-colors group"
                        title="Hapus Repository"
                      >
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}