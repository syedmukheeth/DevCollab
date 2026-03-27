import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AssetGallery = ({ projectId, onClose }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/storage/${projectId}/files`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(res.data);
    } catch (err) {
      console.error('Failed to fetch assets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [projectId]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/storage/${projectId}/upload`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        }
      });
      fetchFiles();
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (key) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/storage/${projectId}/files/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(files.filter(f => f.key !== key));
    } catch (err) {
      alert('Delete failed');
    }
  };

  const isImage = (name) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1e1e1e] border border-white/10 rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#252526]">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Project Assets
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#181818]">
          {loading ? (
            <div className="flex justify-center items-center h-40 text-gray-400 italic">Loading assets...</div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-white/5 rounded-lg text-gray-500">
               <svg className="w-12 h-12 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
               </svg>
               No assets uploaded yet
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {files.map(file => (
                <div key={file.key} className="group relative bg-[#2a2d2e] rounded-lg border border-white/5 overflow-hidden hover:border-blue-500/50 transition-all shadow-lg hover:shadow-blue-500/10">
                  <div className="aspect-square bg-[#1a1a1b] flex items-center justify-center overflow-hidden">
                    {isImage(file.name) ? (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="p-2 truncate text-xs text-gray-300 bg-[#252526] border-t border-white/5">
                    {file.name}
                  </div>
                  
                  {/* Overlay Actions */}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => window.open(file.url, '_blank')}
                      className="p-1.5 bg-black/60 rounded hover:bg-black/90 text-white"
                      title="Open in new tab"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(file.key)}
                      className="p-1.5 bg-red-500/80 rounded hover:bg-red-500 text-white"
                      title="Delete asset"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-[#252526] border-t border-white/10 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {files.length} {files.length === 1 ? 'file' : 'files'} stored in isolated object storage.
          </p>
          <div className="flex gap-2">
             <input 
               type="file" 
               className="hidden" 
               ref={fileInputRef} 
               onChange={handleUpload}
             />
             <button 
               onClick={() => fileInputRef.current.click()}
               disabled={uploading}
               className={`px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all shadow-lg flex items-center gap-2`}
             >
               {uploading ? (
                 <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
               ) : (
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                 </svg>
               )}
               Upload Asset
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetGallery;
